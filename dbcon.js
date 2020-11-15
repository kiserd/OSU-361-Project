var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'ec2-3-211-176-230.compute-1.amazonaws.com',
  port            : 5432,
  user            : 'qxtetfyciswbov',
  password        : '31134b5dcc9de86cf5f8f815858b9140d07cff36a764dfb7b90424c6804a5e38',
  database        : 'd3u5cr9kigu0n5'
});

module.exports.pool = pool;