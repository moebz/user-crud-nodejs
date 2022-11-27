const router = require('express').Router();

const controller = require('./controller');

router.get('/ping', (req, res) => {
  console.log('ping');
  return res.send('ping response');
});

router.get('/users', controller.getUsers);
router.get('/users/:id', controller.getUserById);

module.exports = router;
