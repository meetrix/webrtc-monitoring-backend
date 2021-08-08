# About

- This Merge Request adds an iframe component for the Jitsi Meet view.
- Additionally it removes the hard coded iframe.

## Check list

- [x] Does this include unit/acceptance tests ?
- [ ] Does this MR requires any config changes ?
- [ ] Have you updated the README (If necessary) ?

## How to test

1. Run `docker-compose build server` otherwise, related dependancies will not be installed
2. Checkout to the branch and run the project
3. Go to `localhost:3000/iframe_test`
4. Try to join to the meeting
5. You should be able to join the meeting with video

## Related Tickets

- [https://gitlab.com/meetrix/products/screenapp/online-screen-recorder/-/merge_requests/202]

## Related MRs

- [https://gitlab.com/meetrix/products/screenapp/online-screen-recorder/-/merge_requests/202]

## Deployment instructions

- Add `iframe` option to `config.js`
- Update environment variables in Gitlab build pipeline
