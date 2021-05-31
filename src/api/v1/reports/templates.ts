export const indexTemplate = `<!DOCTYPE html>
<html>

<head>
  <title>Reports</title>
</head>

<body>
  <form action="/v1/reports/feedbacks" method="post">
    <h3>Feedback reports</h3>

    <label for="email">Email: </label><br>
    <input type="email" id="email1" name="email" /><br>

    <label for="password">Password: </label><br>
    <input type="password" id="password1" name="password" /><br>

    <label for="limit">Number of records per page: </label><br>
    <input type="number" min="1" max="1000" id="limit" name="limit" value="100"/><br>

    <input type="submit" name="submitFeedbacks" value="Show feedbacks report" />
  </form>
  <hr>

  <form action="/v1/reports/users" method="post">
    <h3>Recording usage reports</h3>

    <label for="email">Email: </label><br>
    <input type="email" id="email2" name="email" /><br>

    <label for="password">Password: </label><br>
    <input type="password" id="password2" name="password" /><br>

    <label for="number">Minimum recording minutes: </label><br>
    <input type="number" min="0" id="minRecordingMinutes" name="minRecordingMinutes" value="50"/><br>

    <label for="from">From: </label><br>
    <input type="date" id="from" name="from" /><br>

    <label for="to">To: </label><br>
    <input type="date" id="to" name="to" /><br>

    <input type="submit" name="submitUsers" value="Show usage report" /><br>
  </form>
  <hr>

  <form action="/v1/reports/payments/alerts" method="post">
    <h3>Payment alerts</h3>

    <label for="email">Email: </label><br>
    <input type="email" id="email2" name="email" /><br>

    <label for="password">Password: </label><br>
    <input type="password" id="password2" name="password" /><br>

    <!--
    <label for="from">From: </label><br>
    <input type="date" id="from" name="from" /><br>

    <label for="to">To: </label><br>
    <input type="date" id="to" name="to" /><br>
    -->

    <input type="submit" name="submitPaymentAlerts" value="Show payment alerts" /><br>
  </form>
  <hr>

  <a href="/v1/reports/logout">Sign-out</a>
</body>

</html>
`;

export const feedbacksTemplate = `<!DOCTYPE html>
<html>

<head>
  <title>Feedbacks</title>
  <style>
    table,
    th,
    td {
      padding: 10px;
      border: 1px solid black;
      border-collapse: collapse;
    }
  </style>
</head>

<body>

  <table>
    <thead>
      <tr>
        <th>Email</th>
        <th>Rating</th>
        <th>Feedback</th>
        <th>Use Case</th>
        <th>App Version</th>
        <th>Browser</th>
        <th>Browser Version</th>
        <th>OS</th>
        <th>OS Version</th>
        <th>Screen Resolution</th>
        <th>Screen Aspect-Ratio</th>
        <th>Created At</th>
      </tr>
    </thead>
    <tbody>
      {{#each records}}
      <tr>
        <td>{{email}}</td>
        <td>{{rating}}</td>
        <td>{{feedback}}</td>
        <td>{{useCase}}</td>
        <td>{{appVersion}}</td>
        <td>{{browser}}</td>
        <td>{{browserVersion}}</td>
        <td>{{os}}</td>
        <td>{{osVersion}}</td>
        <td>{{screenResolution}}</td>
        <td>{{screenAspectRatio}}</td>
        <td>{{createdAt}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  {{#if prev}}
  <a href="/v1/reports/feedbacks?from={{prev}}&limit={{limit}}">prev</a>
  {{/if}}
  {{#if next}}
  <a href="/v1/reports/feedbacks?from={{next}}&limit={{limit}}">next</a>
  {{/if}}
  <a href="/v1/reports/feedbacks.csv?from={{from}}&limit={{limit}}">download</a>
  <a href="/v1/reports/feedbacks.csv?all=true">download everything</a>
</body>

</html>
`;

export const paymentAlertsTemplate = `<!DOCTYPE html>
<html>

<head>
  <title>Payments</title>
  <style>
    table,
    th,
    td {
      padding: 10px;
      border: 1px solid black;
      border-collapse: collapse;
    }
  </style>
</head>

<body>
  <h1>Needs manual intervention</h1>

  <h2>Stripe</h2>
  <table>
    <thead>
      <tr>
        <th>Subscription Id</th>
        <th>Package</th>
        <th>Customer Id</th>
        <th>Name</th>
        <th>Email</th>
        <th>Currency</th>
        <th>Balance</th>
        <th>User Id (DB)</th>
      </tr>
    </thead>
    <tbody>
      {{#each stripeBalanceRecords}}
      <tr>
        <td><a target="_blank" href="https://dashboard.stripe.com/{{#unless livemode}}test/{{/unless}}subscriptions/{{subscriptionId}}">{{subscriptionId}}</a></td>
        <td>{{package}}</td>
        <td><a target="_blank" href="https://dashboard.stripe.com/{{#unless livemode}}test/{{/unless}}customers/{{customerId}}">{{customerId}}</a></td>
        <td>{{name}}</td>
        <td><a href="mailto:{{email}}">{{email}}</a></td>
        <td>{{currency}}</td>
        <td>{{balance}}</td>
        <td>{{userId}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <p>Balance of the customer needs to be adjusted after a refund. </p>

  <h2>PayPal</h2>
  <!--
  <p>From: {{fromDate}}</p>
  <p>To: {{toDate}}</p>
  -->
  {{#each paypalRecords}}
  <h3>{{_id}}</h3>
  <table>
    <thead>
      <tr>
        <th>Subscription Id</th>
        <th>Package</th>
        <th>Customer Id</th>
        <th>Invoice Id (refund)</th>
        <th>User Id (DB)</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      {{#each subscriptions}}
      <tr>
        <td><a target="_blank" href="https://www.{{#unless ../../live}}sandbox.{{/unless}}paypal.com/billing/subscriptions/{{subscriptionId}}">{{subscriptionId}}</a></td>
        <td>{{package}}</td>
        <td>{{customerId}}</td>
        <td><a target="_blank" href="https://www.{{#unless ../../live}}sandbox.{{/unless}}paypal.com/activities/?fromDate=2020-04-29&toDate=2021-04-29&searchType=ANY&searchKeyword={{invoiceId}}&transactiontype=ALL_TRANSACTIONS&archive=INCLUDE_ARCHIVED_TRANSACTIONS&amount_lower=0&amount_upper=0&currency_value=ALL_TRANSACTIONS_CURRENCY&currency_label=ALL_TRANSACTIONS_CURRENCY">{{invoiceId}}</a></td>
        <td>{{userId}}</td>
        <td>{{createdAt}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  <hr>
  {{/each}}

</body>

</html>
`;
