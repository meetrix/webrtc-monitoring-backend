const User = Object.create({});

interface FindOneParams {
  email: string;
}
User.findOne = ({ email }: FindOneParams): Promise<any> => {
  console.log('find user for email: ', email);
  if (email.startsWith('admin')) {
    console.log('return admin');
    return Promise.resolve({
      _id: 1234,
      id: 1234,
      role: 'admin',
    });
  }
  return Promise.resolve({
    _id: 1234,
    id: 1234,
    role: 'user',
  });
};

User.create = () => Promise.resolve();

export { User };
