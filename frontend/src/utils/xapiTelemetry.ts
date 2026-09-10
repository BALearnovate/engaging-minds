/**
 * xAPI Telemetry Utility (Experience API Spec v1.0.3)
 * Formats and logs standardized xAPI statements whenever a student interacts with an activity.
 */

export interface XApiStatement {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    mbox?: string;
    account?: {
      homePage: string;
      name: string;
    };
  };
  verb: {
    id: string;
    display: {
      [lang: string]: string;
    };
  };
  object: {
    id: string;
    definition: {
      name: { [lang: string]: string };
      description?: { [lang: string]: string };
      type?: string;
    };
  };
  result?: {
    response?: string;
    score?: {
      raw?: number;
      min?: number;
      max?: number;
    };
    completion?: boolean;
    success?: boolean;
  };
  context?: {
    contextActivities?: {
      parent?: Array<{ id: string }>;
    };
    extensions?: Record<string, any>;
  };
}

/**
 * Standard xAPI Verbs URI Reference
 */
export const XAPI_VERBS = {
  ANSWERED: {
    id: 'http://adlnet.gov/expapi/verbs/answered',
    display: { 'en-US': 'answered' },
  },
  INTERACTED: {
    id: 'http://adlnet.gov/expapi/verbs/interacted',
    display: { 'en-US': 'interacted' },
  },
  COMPLETED: {
    id: 'http://adlnet.gov/expapi/verbs/completed',
    display: { 'en-US': 'completed' },
  },
  RESPONDED: {
    id: 'http://adlnet.gov/expapi/verbs/responded',
    display: { 'en-US': 'responded' },
  },
  EXPERIENCED: {
    id: 'http://adlnet.gov/expapi/verbs/experienced',
    display: { 'en-US': 'experienced' },
  },
  ASKED: {
    id: 'http://adlnet.gov/expapi/verbs/asked',
    display: { 'en-US': 'asked' },
  },
};

/**
 * Creates, formats, and console.logs a standardized xAPI Statement
 */
export const logXApiEvent = (params: {
  studentSessionId?: string;
  studentName?: string;
  studentEmail?: string;
  verb: { id: string; display: { [lang: string]: string } };
  activityId: string;
  activityTitle: string;
  blockId?: string;
  blockType?: string;
  responsePayload?: any;
  completion?: boolean;
  score?: number;
}): XApiStatement => {
  const statement: XApiStatement = {
    id: `xapi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor: {
      name: params.studentName || 'Student Learner',
      mbox: params.studentEmail ? `mailto:${params.studentEmail}` : 'mailto:student@engagingminds.app',
      account: {
        homePage: 'http://engagingminds.app',
        name: params.studentName || 'Student Learner',
      },
    },
    verb: params.verb,
    object: {
      id: `http://engagingminds.app/activities/${params.activityId}${params.blockId ? `/blocks/${params.blockId}` : ''}`,
      definition: {
        name: { 'en-US': `${params.activityTitle}${params.blockType ? ` (${params.blockType})` : ''}` },
        type: params.blockType
          ? `http://engagingminds.app/activity-types/${params.blockType}`
          : 'http://adlnet.gov/expapi/activities/cmi.interaction',
      },
    },
    result: {
      response: typeof params.responsePayload === 'object' ? JSON.stringify(params.responsePayload) : String(params.responsePayload ?? ''),
      completion: params.completion ?? false,
      score: params.score !== undefined ? { raw: params.score, min: 0, max: 100 } : undefined,
    },
    context: {
      contextActivities: {
        parent: [{ id: `http://engagingminds.app/activities/${params.activityId}` }],
      },
      extensions: {
        'http://engagingminds.app/xapi/extension/block-type': params.blockType || 'general',
      },
    },
  };

  // Styled console output for high visibility in DevTools console
  console.group('%c📊 [xAPI Statement Emitted]', 'color: #0284c7; font-weight: bold; font-size: 13px;');
  console.log('Actor:', statement.actor.name, `(${statement.actor.mbox})`);
  console.log('Verb:', statement.verb.display['en-US'], `[${statement.verb.id}]`);
  console.log('Object:', statement.object.definition.name['en-US'], `[${statement.object.id}]`);
  console.log('Result:', statement.result);
  console.log('Full JSON Statement:', statement);
  console.groupEnd();

  // Asynchronously persist event to database
  const effectiveSessionId = params.studentSessionId || 'guest_session_preview';
  const verbType = params.verb.display['en-US']?.toUpperCase() || 'INTERACTED';

  fetch('http://localhost:3000/activities/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      studentSessionId: effectiveSessionId,
      type: verbType,
      blockId: params.blockId,
      payload: statement,
    }),
  }).catch((err) => {
    console.warn('⚠️ Failed to persist xAPI event to backend database:', err);
  });

  return statement;
};

