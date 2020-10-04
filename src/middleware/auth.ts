import passport from 'passport';
export const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

export const googleAuthCallback = passport.authenticate('google');

export const facebookAuth = passport.authenticate('facebook', {
    scope: ['email'],
});

export const facebookAuthCallback = passport.authenticate('facebook');

export const linkedinAuth = passport.authenticate('linkedin', {
    scope: ['r_emailaddress', 'r_liteprofile'],
});

export const linkedinAuthCallback = passport.authenticate('linkedin');
