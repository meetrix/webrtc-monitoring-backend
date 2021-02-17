import crypto from 'crypto';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import UUID from 'uuid/v4';
import { USER_PACKAGES, USER_ROLES } from '../config/settings';
import {
  FileSystemEntityDocument,
  fileSystemEntitySchema,
  fileSchema,
  folderSchema,
} from './FileSystemEntity';

export interface Profile {
  name?: string;
  gender?: string;
  location?: string;
  website?: string;
  picture?: string;
  provider?: string;
  providerId?: string;
}

export interface Tag {
  tagId?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  modifiedAt?: string;
}
export interface AuthToken {
  kind: string;
  accessToken: string;
  refreshToken: string;
}
export interface UserAPIFormat {
  email: string;
  role: string;
  package: string;
  profile?: Profile;
  tag?: Tag;
  avatar: string;
  emailToken: string;
}

export interface Stripe {
  customerId: string;
  priceId: string;
  checkoutSessionId: string;
  subscriptionId: string;
  subscriptionItemId: string;
  subscriptionStatus: string;
}

export type UserDocument = mongoose.Document & {
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  emailToken: string;
  isVerified: boolean;
  accessToken: string;
  role: string;
  package: string;
  profile: Profile;
  tag: Tag;
  fileSystem: mongoose.Types.DocumentArray<FileSystemEntityDocument>;

  facebook: string;
  linkedin: string;
  google: string;
  tokens: AuthToken[];
  stripe: Stripe;

  authenticate: (candidatePassword: string) => Promise<boolean>;
  gravatar: (size: number) => string;
  format: () => UserAPIFormat;
};

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailToken: String,
    isVerified: Boolean,
    accessToken: String,
    role: { type: String, default: 'user', enum: USER_ROLES },
    package: { type: String, default: 'FREE_LOGGEDIN', enum: USER_PACKAGES },

    facebook: String,
    linkedin: String,
    google: String,
    tokens: Array,

    profile: {
      name: String,
      gender: String,
      location: String,
      website: String,
      picture: String,
      provider: String,
      providerId: String
    },

    tag: {
      tagId: String,
      title: String,
      status: String,
      createdAt: String,
    },

    fileSystem: [fileSystemEntitySchema],

    stripe: {
      customerId: { type: String, default: null },
      priceId: { type: String, default: null },
      checkoutSessionId: { type: String, default: null },
      subscriptionId: { type: String, default: null },
      subscriptionItemId: { type: String, default: null },
      subscriptionStatus: { type: String, default: 'pending' },
    }
  },
  { timestamps: true }
);

const fileSystemEntityArray = userSchema.path('fileSystem') as unknown as mongoose.Model<FileSystemEntityDocument>;

export const Folder = fileSystemEntityArray.discriminator('Folder', folderSchema);
export const File = fileSystemEntityArray.discriminator('File', fileSchema);
export const FileSystemEntity = mongoose.model('FileSystemEntity', fileSystemEntitySchema);

userSchema.pre('save', async function (next: Function): Promise<void> {
  const user = this as UserDocument;
  if (!user.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods = {
  authenticate: async function (candidatePassword: string): Promise<boolean> {
    if (this.password) {
      return bcrypt.compare(candidatePassword, this.password);
    } else {
      return false;
    }
  },
  gravatar: function (size: number = 200): string {
    if (!this.email) {
      return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto
      .createHash('md5')
      .update(this.email)
      .digest('hex');
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
  },
  format: function (): UserAPIFormat {
    const result = {
      email: this.email,
      role: this.role,
      package: this.package,
      emailToken: this.emailToken,
      isVerified: this.isVerified,
      accessToken: this.accessToken,
      avatar: this.gravatar(),
      profile: {
        name: this.profile.name,
        gender: this.profile.gnder,
        location: this.profile.location,
        website: this.profile.website,
        picture: this.profile.picture,
        provider: this.profile.provider,
        providerId: this.profile.providerId
      },
      tag: {
        tagId: this.tag.tagId,
        title: this.tag.title,
        status: this.tag.status,
        createdAt: this.tag.createdAt
      },
      stripe: {
        customerId: this.stripe.customerId,
        priceId: this.stripe.priceId,
        checkoutSessionId: this.stripe.checkoutSessionId,
        subscriptionId: this.stripe.subscriptionId,
        subscriptionItemId: this.stripe.subscriptionItemId,
        subscriptionStatus: this.stripe.subscriptionStatus,
      }
    };

    return result;
  }
};

export const User = mongoose.model<UserDocument>('User', userSchema);
