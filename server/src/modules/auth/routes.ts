import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { createImageUploader } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import * as authController from './controller';
import { changePasswordSchema, loginSchema, refreshTokenSchema, updateProfileSchema } from './validation';

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
// Same limit and 'users' folder as the admin upload, so a photo is stored identically whoever sets it.
const photoUploader = createImageUploader('users', MAX_PHOTO_SIZE_BYTES);

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

// Self-service: every route acts on req.user only, so none of it needs a Masters permission.
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.get('/profile/photo', authenticate, authController.getProfilePhoto);
router.post('/profile/photo', authenticate, photoUploader.single('photo'), authController.uploadProfilePhoto);
router.put('/password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
