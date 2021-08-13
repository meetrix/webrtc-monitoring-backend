const User = Object.create({});

User.findOne = (): Promise<any> => {
  return Promise.resolve({
    _id: 1234,
  });
};

User.create = () => Promise.resolve();

export { User };
