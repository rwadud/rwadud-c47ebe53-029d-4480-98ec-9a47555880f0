import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let jwtService: any;

  const mockOrg = { id: 1, name: 'HQ', parentId: null };
  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: 'owner' as any,
    organizationId: 1,
    organization: mockOrg as any,
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['organization'],
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.validateUser('bad@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrongpass'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user info on valid login', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@example.com', 'password');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe(1);
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.user.role).toBe('owner');
      expect(result.user.organization.name).toBe('HQ');
    });

    it('should sign JWT with correct payload', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login('test@example.com', 'password');

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'test@example.com',
        role: 'owner',
        organizationId: 1,
        isParentOrg: true,
      });
    });

    it('should set isParentOrg to false for child org users', async () => {
      const childOrgUser = {
        ...mockUser,
        organization: { id: 2, name: 'Branch', parentId: 1 },
      };
      userRepo.findOne.mockResolvedValue(childOrgUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login('test@example.com', 'password');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ isParentOrg: false }),
      );
    });

    it('should throw on invalid credentials', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login('bad@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
