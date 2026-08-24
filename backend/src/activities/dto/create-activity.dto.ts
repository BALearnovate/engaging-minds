import { Allow, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BlankKeyDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class QuestionDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsOptional()
  @IsString()
  correctAnswer?: string;
}

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty({ message: 'Activity title is required' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string; // FILL_IN_THE_BLANK, MULTIPLE_CHOICE, SHORT_ANSWER, DYNAMIC_DOCUMENT

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  rawContent?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlankKeyDto)
  blanks?: BlankKeyDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];

  @IsOptional()
  @IsString()
  h5pType?: string;

  @IsOptional()
  @Allow()
  h5pContent?: any;
}
