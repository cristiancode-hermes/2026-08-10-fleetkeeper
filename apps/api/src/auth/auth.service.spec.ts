import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let jwtService: any;

  const mockUser = {
    id: 'u-1',
    username: 'demo',
    email: 'demo@fleetkeeper.dev',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxabcdefghijklmnopqrstuvwx123456',
    role: 'admin',
    theme: 'system',
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserRepository', useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('crea usuario con password hasheado y devuelve token + user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({
        username: 'Demo',
        email: 'Demo@Fleetkeeper.Dev',
        password: 'demo1234',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'demo',
          email: 'demo@fleetkeeper.dev',
          passwordHash: expect.not.stringMatching('demo1234'),
        }),
      );
      expect(result.token).toBe('jwt-token');
      expect(result.user.username).toBe('demo');
    });

    it('rechaza email duplicado con 409 Conflict', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        service.register({
          username: 'otro',
          email: 'demo@fleetkeeper.dev',
          password: 'demo1234',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('acepta username como identifier', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        identifier: 'demo',
        password: 'demo1234',
      });
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: [{ username: 'demo' }, { email: 'demo' }],
      });
      expect(result.token).toBe('jwt-token');
    });

    it('acepta email como identifier', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        identifier: 'demo@fleetkeeper.dev',
        password: 'demo1234',
      });
      expect(result.token).toBe('jwt-token');
    });

    it('lanza 401 con password incorrecta', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false as never);
      await expect(
        service.login({ identifier: 'demo', password: 'mala' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza 401 si el usuario no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login({ identifier: 'nadie', password: 'demo1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe / updateProfile', () => {
    it('devuelve el usuario seguro', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      const me = await service.getMe('u-1');
      expect(me.email).toBe('demo@fleetkeeper.dev');
      expect(me).not.toHaveProperty('passwordHash');
    });

    it('actualiza el tema sin exponer passwordHash', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser });
      userRepo.save.mockResolvedValue({ ...mockUser, theme: 'dark' });
      const updated = await service.updateProfile('u-1', { theme: 'dark' });
      expect(updated.theme).toBe('dark');
      expect(updated).not.toHaveProperty('passwordHash');
    });
  });
});
