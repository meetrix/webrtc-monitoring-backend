export const indexTemplate = `<!DOCTYPE html>
<html>

<head>
  <title>Reports</title>
</head>

<body>
  <form action="/v1/reports/feedbacks" method="post">
    <label for="email">Email: </label><br>
    <input type="email" id="email1" name="email" /><br>

    <label for="password">Password: </label><br>
    <input type="password" id="password1" name="password" /><br>

    <label for="limit">Number of records per page: </label><br>
    <input type="number" min="1" max="1000" id="limit" name="limit" value="100"/><br>

    <input type="submit" name="submitFeedbacks" value="Show feedbacks report" />
  </form>

<form action="/v1/reports/users" method="post">
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
  <hr>

  <a href="/v1/reports/logout">Sign-out</a>
</form>
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
        <th>App Version</th>
        <th>Browser</th>
        <th>Browser Version</th>
        <th>OS</th>
        <th>OS Version</th>
        <th>Created At</th>
      </tr>
    </thead>
    <tbody>
      {{#each records}}
      <tr>
        <td>{{email}}</td>
        <td>{{rating}}</td>
        <td>{{feedback}}</td>
        <td>{{appVersion}}</td>
        <td>{{browser}}</td>
        <td>{{browserVersion}}</td>
        <td>{{os}}</td>
        <td>{{osVersion}}</td>
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
