import bcrypt from 'bcryptjs';

const userMutations = {
    query: {
        user: {
            async create({ args, query }) {
                if (args.data.password) {
                    const salt = await bcrypt.genSalt();
                    args.data.password = await bcrypt.hash(
                        args.data.password,
                        salt
                    );
                }

                // if (args.data.googleId || args.data.githubId) {
                //     args.data.isEmailVerified = true;
                // }

                if (args.data.username) {
                    args.data.username = args.data.username
                        .trim()
                        .toLowerCase();
                }

                return query(args);
            },
            async update({ args, query }) {
                if (args.data.password) {
                    const salt = await bcrypt.genSalt();
                    args.data.password = await bcrypt.hash(
                        args.data.password,
                        salt
                    );
                }
                return query(args);
            },
        },
    },
};

export { userMutations };
