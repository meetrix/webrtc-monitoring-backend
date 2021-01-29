export const indexTemplate = `<!DOCTYPE html>
<html>

<head>
  <title>Reports</title>
</head>

<body>
  <a href="/v1/reports/feedbacks?from=0&limit=100">Feedbacks report</a>
</body>

</html>
`;


export const feedbacksTemplate = `
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
  <a href="/v1/reports/feedbacks?from={{from}}&limit={{limit}}&type=csv">download</a>
  <a href="/v1/reports/feedbacks?all=true&type=csv">download everything</a>
</body>

</html>
`;
