import { IsObject, IsNotEmpty } from 'class-validator';

export class SubmitActivityDto {
  @IsObject()
  @IsNotEmpty({ message: 'Answers object is required e.g. { "1": "Paris" }' })
  answers: Record<string, string>;
}
