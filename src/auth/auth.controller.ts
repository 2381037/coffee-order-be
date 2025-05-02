import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator'; // Import Public decorator
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity'; // Import User for response type

@ApiTags('Auth') // Group endpoints in Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // Mark this route as public (no JWT required)
  @Post('login')
  @HttpCode(HttpStatus.OK) // Set response code to 200 for successful login
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token.',
    schema: { example: { access_token: 'eyJ...' } },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(loginDto);
  }

  @Public() // Mark this route as public
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: User,
  }) // Adjust response type if needed
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  @ApiResponse({ status: 500, description: 'Could not register user.' })
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    // Return the created user object (without password hash)
    return this.authService.register(registerDto);
  }
}
