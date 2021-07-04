var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/ellehong/f1.git',  
        user: {
            name: 'ellen',
            email: 'no'
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)