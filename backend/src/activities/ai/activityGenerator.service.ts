import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  ActivityDefinition,
  ActivityBlock,
} from '../types/activityDsl';
import { ActivityValidator } from '../validation/activityValidator';

export interface ActivityGenerator {
  generate(prompt: string, subject?: string, gradeLevel?: string): Promise<ActivityDefinition>;
  improveBlock(block: ActivityBlock, prompt: string): Promise<ActivityBlock>;
}

@Injectable()
export class AiActivityGeneratorService implements ActivityGenerator {
  private readonly logger = new Logger(AiActivityGeneratorService.name);

  public async generate(
    prompt: string,
    subject?: string,
    gradeLevel?: string,
  ): Promise<ActivityDefinition> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.logger.log(`Calling Gemini API to generate activity for prompt: "${prompt}"`);
        const geminiDefinition = await this.callGeminiApi(apiKey, prompt, subject, gradeLevel);

        // Run 3-Tier Validation Pipeline
        const valResult = ActivityValidator.validate(geminiDefinition);
        if (valResult.valid) {
          this.logger.log('Gemini activity generated and successfully passed 3-Tier Validation!');
          return geminiDefinition;
        } else {
          this.logger.warn(
            `Gemini API response failed 3-Tier Validation: ${valResult.errors.join('; ')}.`,
          );
          throw new BadRequestException('Could not create activity, try again later.');
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        this.logger.error(`Gemini API call error: ${err.message}.`);
        throw new BadRequestException('Could not create activity, try again later.');
      }
    } else {
      this.logger.log('No GEMINI_API_KEY provided in environment. Using deterministic activity generator.');
      const fallbackDef = await this.generateDeterministic(prompt, subject, gradeLevel);
      const valResult = ActivityValidator.validate(fallbackDef);
      if (!valResult.valid) {
        throw new BadRequestException('Could not create activity, try again later.');
      }
      return fallbackDef;
    }
  }

  /**
   * Gemini API Call with Sanitization & Structured JSON Output
   */
  private async callGeminiApi(
    apiKey: string,
    prompt: string,
    subject?: string,
    gradeLevel?: string,
  ): Promise<ActivityDefinition> {
    const systemInstruction = `You are an expert secondary school educational curriculum designer.
Generate an interactive learning activity DSL strictly in valid JSON format adhering to schemaVersion "1.0".
The generated JSON MUST contain:
- "schemaVersion": "1.0"
- "title": A clear lesson title
- "description": A concise lesson overview
- "estimatedDurationMinutes": 15
- "blocks": An array of interactive exercise blocks suitable for secondary school students (e.g. Grade 6 / Year 7).

Supported interactive exercise block types:
1. "flashcards": config { "cards": [{ "id": "c1", "prompt": "...", "answer": "...", "hint": "..." }] }
2. "multiple_choice": config { "question": "...", "options": ["..."], "correctAnswer": "...", "explanation": "..." }
3. "fill_blank": config { "passage": "... [1] ... [2] ...", "blanks": [{ "id": "1", "answer": "...", "hint": "..." }] }
4. "true_false": config { "statement": "...", "isTrue": true/false, "explanation": "..." }
5. "ordering": config { "prompt": "...", "items": [{ "id": "i1", "content": "..." }], "correctOrder": ["i1", ...] }
6. "drag_drop": config { "instructions": "...", "draggableItems": [{ "id": "d1", "content": "..." }], "dropTargets": [{ "id": "t1", "label": "...", "correctItemIds": ["d1"] }] }
7. "find_hotspots": config { "imageUrl": "https://...", "instructions": "Click on the diagram to locate spots...", "hotspots": [{ "id": "h1", "label": "...", "x": 35, "y": 45, "radius": 10 }] }
8. "clock_diagram": config { "prompt": "Fill in your 24-hour daily schedule...", "instructions": "Write what you do in each hour directly in front of the radial clock sectors...", "clockType": "24_hour", "hours": [{ "hour": 0, "label": "00:00", "expectedActivity": "..." }], "allowedOptions": ["Breakfast", "Class", "Lunch", "Homework", "Sleep"] }

CRITICAL RULES:
- Only include block types that are relevant to or requested in the prompt.
- Every block MUST have a "title" string (e.g. "Step 1: Core Concepts"), "instructions" string, and a unique "id" string (e.g. "blk_1_fc", "blk_2_mc").
- In "multiple_choice", "correctAnswer" MUST exactly match one of the string options.
- In "fill_blank", placeholders like [1] or [2] in "passage" MUST match the "id" of the corresponding blank object.
- In "ordering", "correctOrder" array MUST contain all item IDs.
- In "drag_drop", "correctItemIds" in "dropTargets" MUST reference existing "draggableItems" IDs.
- In "find_hotspots", "x" and "y" MUST be percentages between 0 and 100 representing spot coordinates on the image.
- In "clock_diagram", "hours" MUST be an array containing objects with "hour" (number 0-23 or 1-24).`;

    const userPromptText = `Subject: ${subject || 'General Secondary Education'}
Grade Level: ${gradeLevel || 'Secondary School (Grade 6-8)'}
Teacher Prompt: "${prompt}"

Generate a complete, engaging interactive activity containing appropriate exercises matching the prompt requirements.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemInstruction}\n\n${userPromptText}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errText}`);
    }

    const resData: any = await response.json();
    const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini API returned an empty response part.');
    }

    const parsedJson: ActivityDefinition = JSON.parse(candidateText);

    // Sanitize & Normalize block titles/instructions if missing
    if (parsedJson && Array.isArray(parsedJson.blocks)) {
      parsedJson.blocks.forEach((block: any, idx: number) => {
        if (!block.id) block.id = `blk_${idx + 1}_${Date.now()}`;
        if (!block.title) {
          const typeLabel = block.type ? block.type.replace('_', ' ').toUpperCase() : 'EXERCISE';
          block.title = `Step ${idx + 1}: ${typeLabel}`;
        }
        if (!block.instructions || block.instructions.trim().length < 3) {
          block.instructions = 'Complete the exercise below by selecting or typing your response.';
        }
      });
    }

    return parsedJson;
  }

  /**
   * Fallback Activity Generator adhering strictly to 3-Tier Validation
   */
  private async generateDeterministic(
    prompt: string,
    subject?: string,
    gradeLevel?: string,
  ): Promise<ActivityDefinition> {
    const lowerPrompt = prompt.toLowerCase();
    const isPhotosynthesis = lowerPrompt.includes('photosynthesis') || lowerPrompt.includes('plant');
    const isFractions = lowerPrompt.includes('fraction') || lowerPrompt.includes('math');

    let title = 'Interactive Learning Activity';
    if (isPhotosynthesis) {
      title = 'Grade 6 Science: Photosynthesis & Plant Energy';
    } else if (isFractions) {
      title = 'Grade 6 Math: Mastering Fractions & Decimals';
    } else {
      title = `${subject || 'Secondary Education'}: ${prompt.slice(0, 40)}`;
    }

    const blocks: ActivityBlock[] = [
      {
        id: `blk_fc_${Date.now()}_1`,
        type: 'flashcards',
        title: 'Step 1: Core Concept Flashcards',
        instructions: 'Flip through cards to review fundamental concepts.',
        config: {
          cards: isPhotosynthesis
            ? [
                { id: 'c1', prompt: 'What organelle carries out photosynthesis?', answer: 'Chloroplast', hint: 'Contains green pigment' },
                { id: 'c2', prompt: 'What gas do plants absorb during photosynthesis?', answer: 'Carbon Dioxide (CO2)', hint: 'Absorbed from air' },
                { id: 'c3', prompt: 'What sugar is produced during photosynthesis?', answer: 'Glucose (C6H12O6)', hint: 'Plant energy food' },
              ]
            : [
                { id: 'c1', prompt: 'What is the numerator in 3/4?', answer: '3 (The top number representing parts taken)', hint: 'Top number' },
                { id: 'c2', prompt: 'What is the denominator in 5/8?', answer: '8 (The bottom number representing total equal parts)', hint: 'Bottom number' },
                { id: 'c3', prompt: 'What is an equivalent fraction for 1/2?', answer: '2/4, 3/6, or 4/8', hint: 'Multiply top and bottom by 2' },
              ],
        },
      },
      {
        id: `blk_clk_${Date.now()}_2`,
        type: 'clock_diagram',
        title: 'Step 2: 24-Hour Daily Schedule Radial Clock Diagram',
        instructions: 'Type what you do in each hour directly in front of each 24-hour radial clock sector below.',
        config: {
          prompt: 'Record what activity takes place during each hour of the 24-hour schedule:',
          instructions: 'Type your response into the input box positioned directly in front of each 24-hour clock sector.',
          clockType: '24_hour',
          allowedOptions: ['Breakfast / Prep', 'Math / Science Class', 'Lab Experiment', 'Lunch Break', 'Sports / PE', 'Homework', 'Dinner', 'Rest / Sleep'],
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
          })),
        },
      },
      {
        id: `blk_hs_${Date.now()}_3`,
        type: 'find_hotspots',
        title: 'Step 3: Find Multiple Hotspots in Diagram',
        instructions: isPhotosynthesis
          ? 'Click on the diagram image to locate the Chloroplast, Stomata, and Plant Cell Wall.'
          : 'Click on the diagram image to find the Numerator region, Denominator region, and Fraction Bar.',
        config: {
          imageUrl: 'https://placeholder.svg',
          instructions: isPhotosynthesis
            ? 'Find and click on 1. Chloroplast, 2. Stomata, 3. Cell Wall.'
            : 'Find and click on 1. Numerator Region, 2. Denominator Region, 3. Fraction Bar.',
          hotspots: isPhotosynthesis
            ? [
                { id: 'hs1', label: 'Chloroplast Organelle', x: 35, y: 40, radius: 12, feedback: 'Chloroplasts absorb solar energy.' },
                { id: 'hs2', label: 'Stomata Leaf Pore', x: 60, y: 30, radius: 12, feedback: 'Stomata regulate gas exchange.' },
                { id: 'hs3', label: 'Plant Cell Wall', x: 50, y: 75, radius: 12, feedback: 'Provides structural cell support.' },
              ]
            : [
                { id: 'hs1', label: 'Numerator Top Region', x: 35, y: 30, radius: 12, feedback: 'Upper part representing parts taken.' },
                { id: 'hs2', label: 'Denominator Bottom Region', x: 65, y: 30, radius: 12, feedback: 'Lower part representing total whole.' },
                { id: 'hs3', label: 'Fraction Division Bar', x: 50, y: 70, radius: 12, feedback: 'Separates numerator and denominator.' },
              ],
        },
      },
      {
        id: `blk_mc_${Date.now()}_4`,
        type: 'multiple_choice',
        title: 'Step 4: Multiple Choice Quiz',
        instructions: 'Select the best answer for the question below.',
        config: {
          question: isPhotosynthesis
            ? 'Which chemical pigment gives plant leaves their green color?'
            : 'Which fraction is equivalent to 3/4?',
          options: isPhotosynthesis
            ? ['Chlorophyll', 'Carotene', 'Anthocyanin', 'Hemoglobin']
            : ['6/8', '5/8', '3/8', '9/16'],
          correctAnswer: isPhotosynthesis ? 'Chlorophyll' : '6/8',
          explanation: isPhotosynthesis
            ? 'Chlorophyll is the green pigment in chloroplasts that absorbs light energy.'
            : 'Multiplying numerator and denominator by 2 yields 6/8.',
        },
      },
      {
        id: `blk_fb_${Date.now()}_5`,
        type: 'fill_blank',
        title: 'Step 5: Fill in the Blank Passage',
        instructions: 'Type the correct missing terms into the input blanks.',
        config: {
          passage: isPhotosynthesis
            ? 'Photosynthesis requires sunlight, carbon dioxide, and [1] to produce glucose and [2].'
            : 'In a fraction, the top number is the [1] and the bottom number is the [2].',
          blanks: isPhotosynthesis
            ? [
                { id: '1', answer: 'water', hint: 'H2O from roots' },
                { id: '2', answer: 'oxygen', hint: 'Gas released into air' },
              ]
            : [
                { id: '1', answer: 'numerator', hint: 'Top number' },
                { id: '2', answer: 'denominator', hint: 'Bottom number' },
              ],
        },
      },
      {
        id: `blk_tf_${Date.now()}_6`,
        type: 'true_false',
        title: 'Step 6: True / False Evaluation',
        instructions: 'Determine whether the statement is True or False.',
        config: {
          statement: isPhotosynthesis
            ? 'Plants can perform the light-dependent reactions of photosynthesis in complete darkness.'
            : 'In a proper fraction, the numerator is always smaller than the denominator.',
          isTrue: isPhotosynthesis ? false : true,
          explanation: isPhotosynthesis
            ? 'False! Light-dependent reactions require solar energy to split water molecules.'
            : 'True! A proper fraction represents a value strictly less than 1 whole.',
        },
      },
      {
        id: `blk_ord_${Date.now()}_7`,
        type: 'ordering',
        title: 'Step 7: Sequence & Ordering Exercise',
        instructions: 'Arrange the items into the correct sequence.',
        config: {
          prompt: isPhotosynthesis
            ? 'Order the steps of energy flow in photosynthesis:'
            : 'Sort the fractions in ascending order (smallest to largest):',
          items: isPhotosynthesis
            ? [
                { id: 'i1', content: 'Sunlight strikes chlorophyll in chloroplasts' },
                { id: 'i2', content: 'Water splits releasing oxygen gas' },
                { id: 'i3', content: 'Carbon dioxide combines to produce glucose sugar' },
              ]
            : [
                { id: 'i1', content: '1/4 (0.25)' },
                { id: 'i2', content: '1/2 (0.50)' },
                { id: 'i3', content: '3/4 (0.75)' },
              ],
          correctOrder: ['i1', 'i2', 'i3'],
        },
      },
      {
        id: `blk_dd_${Date.now()}_8`,
        type: 'drag_drop',
        title: 'Step 8: Drag & Drop Classification',
        instructions: 'Drag each item into its correct target category bin.',
        config: {
          instructions: isPhotosynthesis
            ? 'Classify items into Inputs (Reactants) vs Outputs (Products):'
            : 'Categorize terms into Numerator vs Denominator properties:',
          draggableItems: isPhotosynthesis
            ? [
                { id: 'd1', content: 'Sunlight Energy' },
                { id: 'd2', content: 'Carbon Dioxide' },
                { id: 'd3', content: 'Water' },
                { id: 'd4', content: 'Glucose Sugar' },
                { id: 'd5', content: 'Oxygen Gas' },
              ]
            : [
                { id: 'd1', content: 'Top Number' },
                { id: 'd2', content: 'Bottom Number' },
                { id: 'd3', content: 'Parts Taken' },
                { id: 'd4', content: 'Total Parts in Whole' },
              ],
          dropTargets: isPhotosynthesis
            ? [
                { id: 'target_in', label: 'Inputs (Reactants)', correctItemIds: ['d1', 'd2', 'd3'] },
                { id: 'target_out', label: 'Outputs (Products)', correctItemIds: ['d4', 'd5'] },
              ]
            : [
                { id: 'target_num', label: 'Numerator Properties', correctItemIds: ['d1', 'd3'] },
                { id: 'target_den', label: 'Denominator Properties', correctItemIds: ['d2', 'd4'] },
              ],
        },
      },
    ];

    const definition: ActivityDefinition = {
      schemaVersion: '1.0',
      title,
      description: `Structured interactive activity generated for prompt: "${prompt}"`,
      estimatedDurationMinutes: 15,
      blocks,
    };

    // Run 3-Tier Validation
    const valResult = ActivityValidator.validate(definition);
    if (!valResult.valid) {
      throw new Error(`Fallback activity generation validation error: ${valResult.errors.join('; ')}`);
    }

    return definition;
  }

  public async improveBlock(block: ActivityBlock, prompt: string): Promise<ActivityBlock> {
    const updatedBlock: ActivityBlock = JSON.parse(JSON.stringify(block));
    const lowerPrompt = prompt.toLowerCase();

    switch (updatedBlock.type) {
      case 'multiple_choice': {
        const cfg = updatedBlock.config as any;
        if (lowerPrompt.includes('hard') || lowerPrompt.includes('difficult')) {
          cfg.question = `${cfg.question} (Advanced Challenge)`;
        }
        break;
      }
      case 'fill_blank': {
        const cfg = updatedBlock.config as any;
        cfg.passage = `${cfg.passage} (Review carefully!)`;
        break;
      }
      case 'flashcards': {
        const cfg = updatedBlock.config as any;
        cfg.cards.push({
          id: `c_ai_${Date.now()}`,
          prompt: 'Bonus Flashcard: Why is this concept fundamental?',
          answer: 'Understanding core principles enables higher-order reasoning.',
          hint: 'Key summary concept',
        });
        break;
      }
    }

    return updatedBlock;
  }
}
