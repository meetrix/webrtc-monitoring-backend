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

export type Role = 'user' | 'admin' | 'owner';

export interface Profile {
  name?: string;
  gender?: string;
  location?: string;
  domain?: string;
  picture?: string;
  provider?: string;
  providerId?: string;
  companyName?: string;
  contactNumber?: string;
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
  role: Role;
  package: string;
  /** Maximum package that the user ever had access to. */
  limitedPackage: string;
  trialsConsumed: string[];
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

export interface PayPal {
  payerId: string;
  emailAddress: string;
  planId: string;
  subscriptionId: string;
  subscriptionStatus: string;
}

export type UserDocument = mongoose.Document & {
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  emailToken: string;
  isVerified: boolean;
  isFirstTimeUser: boolean;
  accessToken: string;
  role: Role;
  package: string;
  limitedPackage: string;
  trialsConsumed: string[];
  profile: Profile;
  tag: Tag;
  fileSystem: mongoose.Types.DocumentArray<FileSystemEntityDocument>;
  fileSystemSettings: { cloudSync: boolean };
  features: { plugin: boolean };

  facebook: string;
  linkedin: string;
  google: string;
  tokens: AuthToken[];
  stripe: Stripe;
  paypal: PayPal;

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
    isFirstTimeUser: { type: Boolean, default: true },
    accessToken: String,
    role: { type: String, default: 'user', enum: USER_ROLES },
    package: { type: String, default: 'FREE_LOGGEDIN', enum: USER_PACKAGES },
    limitedPackage: {
      type: String,
      default: 'FREE_LOGGEDIN',
      enum: USER_PACKAGES,
    },
    trialsConsumed: [String],
    facebook: String,
    linkedin: String,
    google: String,
    tokens: Array,

    profile: {
      name: String,
      gender: String,
      location: String,
      domain: String,
      picture: String,
      provider: String,
      providerId: String,
      companyName: String,
      contactNumber: String,
    },

    tag: {
      tagId: String,
      title: String,
      status: String,
      createdAt: String,
    },

    fileSystem: [fileSystemEntitySchema],
    fileSystemSettings: { cloudSync: { type: Boolean, default: false } },
    features: { plugin: Boolean },

    stripe: {
      customerId: { type: String, default: null },
      priceId: { type: String, default: null },
      checkoutSessionId: { type: String, default: null },
      subscriptionId: { type: String, default: null },
      subscriptionItemId: { type: String, default: null },
      subscriptionStatus: { type: String, default: 'pending' },
    },

    paypal: {
      payerId: { type: String, default: null }, // subscription.subscriber.payer_id
      emailAddress: { type: String, default: null }, // subscription.subscriber.email_address
      planId: { type: String, default: null }, // subscription.plan_id
      subscriptionId: { type: String, default: null }, // subscription.id
      // pending: [APPROVAL_PENDING, APPROVED], active: [ACTIVE], inactive: [SUSPENDED, CANCELLED, EXPIRED]
      subscriptionStatus: { type: String, default: 'pending' },
    },
  },
  { timestamps: true }
);

const fileSystemEntityArray = userSchema.path(
  'fileSystem'
) as unknown as mongoose.Model<FileSystemEntityDocument>;

export const Folder = fileSystemEntityArray.discriminator(
  'Folder',
  folderSchema
);
export const File = fileSystemEntityArray.discriminator('File', fileSchema);
export const FileSystemEntity = mongoose.model(
  'FileSystemEntity',
  fileSystemEntitySchema
);

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
    const md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
  },
  format: function (): UserAPIFormat {
    const result = {
      email: this.email,
      role: this.role,
      package: this.package,
      limitedPackage: this.limitedPackage,
      trialsConsumed: this.trialsConsumed,
      emailToken: this.emailToken,
      isVerified: this.isVerified,
      isFirstTimeUser: this.isFirstTimeUser,
      accessToken: this.accessToken,
      avatar: this.gravatar(),
      profile: {
        name: this.profile.name,
        gender: this.profile.gnder,
        location: this.profile.location,
        domain: this.profile.domain,
        picture: this.profile.picture,
        provider: this.profile.provider,
        providerId: this.profile.providerId,
        companyName: this.profile.companyName,
        contactNumber: this.profile.contactNumber,
      },
      tag: {
        tagId: this.tag.tagId,
        title: this.tag.title,
        status: this.tag.status,
        createdAt: this.tag.createdAt,
      },
      stripe: {
        customerId: this.stripe.customerId,
        priceId: this.stripe.priceId,
        checkoutSessionId: this.stripe.checkoutSessionId,
        subscriptionId: this.stripe.subscriptionId,
        subscriptionItemId: this.stripe.subscriptionItemId,
        subscriptionStatus: this.stripe.subscriptionStatus,
      },
      paypal: {
        payerId: this.paypal.payerId,
        emailAddress: this.paypal.emailAddress,
        planId: this.paypal.planId,
        subscriptionId: this.paypal.subscriptionId,
        subscriptionStatus: this.paypal.subscriptionStatus,
      },
    };

    return result;
  },
};

export const User = mongoose.model<UserDocument>('User', userSchema);
