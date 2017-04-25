const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

let categorySchema = mongoose.Schema(
    {
        name: {type: String, required: true, unique: true},
        articles: [{type: [ObjectId], ref: 'Article'}],
    }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

module.exports.initializeCategories = () => {
    createCategory('Cat Care');
    createCategory('Cat Health');
    createCategory('Cat Breeds');
    createCategory('Blog');
};

function createCategory(name) {
    Category.findOne({name: name}).then((category) => {
        if (!category) {
            let category = {
                articles:[],
                name: name
            };

            Category.create(category).then(category => {
                category.save(err => {
                    if(err){
                        console.log(err.message);
                    }else{
                        console.log('Category created!');
                    }
                });
            })
        }
    })
}