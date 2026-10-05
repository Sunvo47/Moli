import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const movies = [
{
title: 'Inception',
description: 'A skilled thief who steals secrets through dreams is offered a chance to erase his past by planting an idea in someone’s mind.',
poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
type: 'MOVIE',
genre: 'Sci-Fi',
duration: 148,
rating: 8.8,
rentalPrice: 99,
rentalDuration: 48,
releaseDate: new Date('2010-07-16'),
},
{
title: 'Interstellar',
description: 'A group of explorers travel through a wormhole in space in search of a new home for humanity.',
poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK3sQZPvS.jpg',
type: 'MOVIE',
genre: 'Sci-Fi',
duration: 169,
rating: 8.7,
rentalPrice: 99,
rentalDuration: 48,
releaseDate: new Date('2014-11-07'),
},
{
title: 'The Dark Knight',
description: 'Batman faces a criminal mastermind who plunges Gotham City into chaos while testing the limits of the hero’s morality.',
poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
type: 'MOVIE',
genre: 'Action',
duration: 152,
rating: 9.0,
rentalPrice: 99,
rentalDuration: 48,
releaseDate: new Date('2008-07-18'),
},
{
title: 'Avengers: Endgame',
description: 'The surviving Avengers unite for one final mission to reverse the devastating events that changed the universe.',
poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
type: 'MOVIE',
genre: 'Action',
duration: 181,
rating: 8.4,
rentalPrice: 129,
rentalDuration: 48,
releaseDate: new Date('2019-04-26'),
},
{
title: 'Spider-Man: Into the Spider-Verse',
description: 'Miles Morales becomes Spider-Man and discovers a multiverse filled with heroes from different dimensions.',
poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/6iYoO3h6M7vN9y8X9Z3c2Q9X1.jpg',
type: 'MOVIE',
genre: 'Animation',
duration: 117,
rating: 8.4,
rentalPrice: 99,
rentalDuration: 48,
releaseDate: new Date('2018-12-14'),
},
{
title: 'The Batman',
description: 'Batman investigates a series of brutal crimes while uncovering corruption buried deep within Gotham City.',
poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5P4S1GzY2m9R.jpg',
type: 'MOVIE',
genre: 'Crime',
duration: 176,
rating: 7.8,
rentalPrice: 119,
rentalDuration: 48,
releaseDate: new Date('2022-03-04'),
},
{
title: 'Dune',
description: 'A young nobleman must travel to the most dangerous planet in the universe to protect his family and future.',
poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/jYEW5xZkZk2W6Yj2b7d8V7Q9rZL.jpg',
type: 'MOVIE',
genre: 'Sci-Fi',
duration: 155,
rating: 8.0,
rentalPrice: 119,
rentalDuration: 48,
releaseDate: new Date('2021-10-22'),
},
{
title: 'John Wick',
description: 'A legendary assassin is forced back into action after criminals destroy the last connection to his former life.',
poster: 'https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/7dzngS8pL2d9XqW8mY5n3V1c6Qb.jpg',
type: 'MOVIE',
genre: 'Action',
duration: 101,
rating: 7.4,
rentalPrice: 89,
rentalDuration: 48,
releaseDate: new Date('2014-10-24'),
},
{
title: 'Everything Everywhere All at Once',
description: 'A woman discovers countless versions of herself across the multiverse and must find a way to save them all.',
poster: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/wQ0W3L7q3zX9L2M5N8B1C6V4D7E.jpg',
type: 'MOVIE',
genre: 'Fantasy',
duration: 139,
rating: 7.8,
rentalPrice: 99,
rentalDuration: 48,
releaseDate: new Date('2022-04-08'),
},
{
title: 'Top Gun: Maverick',
description: 'A legendary pilot returns to train a new generation of aviators for an extremely dangerous mission.',
poster: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
backdrop: 'https://image.tmdb.org/t/p/original/AaV1YIdWKUzZvaR4Gk7l8X9m0Qb.jpg',
type: 'MOVIE',
genre: 'Action',
duration: 130,
rating: 8.3,
rentalPrice: 119,
rentalDuration: 48,
releaseDate: new Date('2022-05-27'),
},
];
async function main() {
console.log('Seeding movies...');
for (const movie of movies) {
await prisma.movie.create({
data: movie,
});
}
console.log(`Added ${movies.length} movies.`);
}
main()
.catch((error) => {
console.error(error);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});

