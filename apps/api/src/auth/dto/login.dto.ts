import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @Matches(/^[6-9]\d{9}$/, { message: 'phone must be a valid 10-digit Indian mobile number' })
  phone: string;

  @IsString()
  @Length(8, 100)
  password: string;
}
