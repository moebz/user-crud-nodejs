const router = require('express').Router();

const controller = require('./controller');

router.get('/ping', (req, res) => {
  console.log('ping');
  return res.send('ping response');
});

router.get('/users', controller.getUsers);
router.get('/users/:id', controller.getUserById);
router.post('/users', controller.createUser);
router.post('/login', controller.login);

module.exports = router;
