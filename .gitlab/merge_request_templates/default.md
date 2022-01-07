# About

- This Merge Request adds an iframe component for the Jitsi Meet view.
- Additionally, it removes the hard-coded iframe.

## Checklist

- [x] Does this include unit/acceptance tests?
- [ ] Does this MR requires any config changes?
- [ ] Have you updated the README (If necessary)?
- [ ] Are there any breaking changes ?
- [ ] Have you included the correct branch of `webrtc-monitoring-common-lib` in dependencies

## How to test

1. Run `docker-compose build server` otherwise, related dependencies will not be installed

## Related Tickets

- [https://gitlab.com/meetrix/products/screenapp/online-screen-recorder/-/merge_requests/202]

## Related MRs

- `webrtc-monitoring-common-lib`: N/A

- `lib-webrtc-monitoring`: N/A

- `webrtc-monitoring-backend`: N/A

- `webrtc-monitoring-frontend`: N/A

## Deployment instructions

- Add `iframe` option to `config.js`
- Update environment variables in Gitlab build pipeline
