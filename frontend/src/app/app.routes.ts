import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Movies } from './pages/movies/movies';
import { Library } from './pages/library/library';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { MovieDetail } from './pages/movie-detail/movie-detail';
import { Watch } from './pages/watch/watch';
import { Reels } from './pages/reels/reels';
import { Admin } from './pages/admin/admin';
import { AdminTroll } from './pages/admin-troll/admin-troll';
import { ProfilePage } from './pages/profile/profile';
import { SettingsPage } from './pages/settings/settings';

export const routes: Routes = [
{
path: '',
redirectTo: 'home',
pathMatch: 'full'
},
{
path: 'home',
component: Home
},
{
path: 'movies',
component: Movies
},
{
path: 'movies/:id',
component: MovieDetail
},
{
path: 'watch/:id',
component: Watch
},
{
path: 'reels',
component: Reels
},
{
path: 'library',
component: Library
},
{
path: 'login',
component: Login
},
{
path: 'register',
component: Register
},
{
path: 'forgot-password',
component: ForgotPassword
},
{ path: 'admin', component: AdminTroll },
{ path: 'backendmolinongsunja', 
component: Admin 
},
{ path: 'profile', 
component: ProfilePage 
},
{ path: 'settings', 
component: SettingsPage 
},
{
path: '**',
redirectTo: 'home'
}
];