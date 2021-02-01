export const indexTemplate = `<!DOCTYPE html>
<html>

<head>
  <title>Reports</title>
</head>

<body>
  <form action="/v1/reports/feedbacks" method="post">
    <label for="email">Email: </label><br>
    <input type="email" id="email" name="email" /><br>

    <label for="password">Password: </label><br>
    <input type="password" id="password" name="password" /><br>

    <label for="number">Number of records per page: </label><br>
    <input type="number" min="1" max="1000" id="limit" name="limit" value="100"/><br>

    <input type="submit" value="Show feedbacks report" />
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
  <a href="/v1/reports/feedbacks?from={{prev}}&limit={{limit}}&token={{token}}">prev</a>
  {{/if}}
  {{#if next}}
  <a href="/v1/reports/feedbacks?from={{next}}&limit={{limit}}&token={{token}}">next</a>
  {{/if}}
  <a href="/v1/reports/feedbacks?from={{from}}&limit={{limit}}&type=csv&token={{token}}">download</a>
  <a href="/v1/reports/feedbacks?all=true&type=csv&token={{token}}">download everything</a>
</body>

</html>
`;
