import { IsEmail, IsIn, IsString, Length, Matches } from 'class-validator';

export class SignupDto {
  @IsIn(['BUYER', 'SELLER'])
  role: 'BUYER' | 'SELLER';

  @IsString()
  @Length(2, 120)
  fullName: string;

  @Matches(/^[6-9]\d{9}$/, {
    message: 'phone must be a valid 10-digit Indian mobile number',
  })
  phone: string;

  @IsString()
  @Length(8, 100)
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 120)
  locationCity: string;

  @IsString()
  @Length(2, 120)
  locationState: string;
}
