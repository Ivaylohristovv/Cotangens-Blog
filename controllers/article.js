const Article = require('mongoose').model('Article');
const Category = require('mongoose').model('Category');


module.exports = {
    createGet: (req, res) => {
        Category.find({}).then(categories => {
            res.render('article/create', {categories});
        });
    },
    createPost: (req, res) => {
        let articleArgs = req.body;

        let errorMsg = '';

        if (!req.isAuthenticated()){
            errorMsg = 'Sorry, you must be logged in!';
        }else if (!articleArgs.title){
            errorMsg = 'Title is required!';
        }else if(!articleArgs.content){
            errorMsg = 'Content is required!';
        }

        if(errorMsg){
            res.render('article/create', {
                error: errorMsg
            });

            return;
        }

        let userId = req.user.id;
        Category.findOne({name: articleArgs.category}).then(category => {
            articleArgs.category = category._id;
            articleArgs.author = userId;

            Article.create(articleArgs).then(article => {
                req.user.articles.push(article.id);
                req.user.save(err => {
                    if(err){
                        res.render('article/create', {
                            error: err.message
                        });
                    }else{
                        res.redirect('/');
                    }
                })
            })
        });

    },
    details:(req, res) => {
        let id = req.params.id;

        Article.findById(id).populate('category').populate('author').then(article =>{
            if(!req.user){
                res.render('article/details', {article: article, isUserAuthorized: false});
                return;
            }
            req.user.isInRole('Admin').then(isAdmin => {
                let isUserAuthorized = isAdmin || req.user.isAuthor(article);
                res.render('article/details', {article: article, isUserAuthorized: isUserAuthorized});
            })

        })
    },
    editGet: (req, res) => {
        let id = req.params.id;

        if(!req.isAuthenticated()){
            let returnUrl = `/article/edit/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }
        Article.findById(id).then(article =>{
            req.user.isInRole('Admin').then(isAdmin => {
                if(!isAdmin && !req.user.isAuthor(article)){
                    res.redirect('/');
                    return;
                }

                res.render('article/edit', article)
            });
        });


    },

    editPost: (req, res) => {
        let id = req.params.id;

        let articleArgs = req.body;
        let errorMsg = '';

        if (!articleArgs.title){
            errorMsg = 'Article title cannot be empty!';
        }else if(!articleArgs.content){
            errorMsg = 'Article content cannot be empty!';
        }

        if(errorMsg){
            res.render('article/edit', {error:errorMsg})
        }else{
            Article.update({_id: id}, {$set: {title: articleArgs.title, content: articleArgs.content}})
                .then(updateStatus => {
                    res.redirect(`/article/details/${id}`);
                })
        }
    },
    deleteGet: (req, res) => {
        let id = req.params.id;

        if(!req.isAuthenticated()){
            let returnUrl = `/article/delete/$ {id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }
        Article.findById(id).then(article => {
            req.user.isInRole('Admin').then(isAdmin => {
                if(!isAdmin && !req.user.isAuthor(article)){
                    res.redirect('/');
                    return;
                }

                res.render('article/delete', article)
            });
        });

    },

    deletePost: (req, res) => {
        let id = req.params.id;

        Article.findOneAndRemove({_id: id}).populate('author').then(article => {
            let author = article.author;

            let index = author.articles.indexOf(article.id);

            if(index < 0){
                let errorMsg = 'Article was not found for that author!';
            }else{
                let count = 1;
                author.articles.splice(index, count);
                author.save().then((user) => {
                    res.redirect('/');
                });
            }
        })
    },
};

