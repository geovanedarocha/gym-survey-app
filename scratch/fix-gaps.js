const fs = require('fs');

let c = fs.readFileSync('src/app/page.tsx', 'utf-8');

c = c.replace(/flex gap-(\d+)/g, 'flex space-x-$1');
c = c.replace(/flex flex-col (.*?)gap-(\d+)/g, 'flex flex-col $1space-y-$2');
c = c.replace(/flex items-center gap-(\d+)/g, 'flex items-center space-x-$1');
c = c.replace(/flex items-center justify-center gap-(\d+)/g, 'flex items-center justify-center space-x-$1');
c = c.replace(/flex overflow-x-auto snap-x gap-(\d+)/g, 'flex overflow-x-auto snap-x space-x-$1');
c = c.replace(/flex w-full justify-between items-center flex-wrap gap-(\d+)/g, 'flex w-full justify-between items-center flex-wrap space-x-$1');

fs.writeFileSync('src/app/page.tsx', c);
