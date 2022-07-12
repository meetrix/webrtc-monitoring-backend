#!/bin/bash

echo "Starting TURN/STUN server"

turnserver -a -v --lt-cred-mech --user "${TURN_USER}" --cli-password password --fingerprint --server-name "${TURN_SERVER_NAME}" --realm=${TURN_REALM} -p ${TURN_PORT} --min-port ${TURN_PORT_START} --max-port ${TURN_PORT_END} ${TURN_EXTRA}
