var ghpages = require('gh-pages');

ghpages.publish(
    'docs', // path to docs directory
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