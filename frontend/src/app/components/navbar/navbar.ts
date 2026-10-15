import {
Component,
OnInit,
OnDestroy,
ChangeDetectorRef,
NgZone
} from '@angular/core';

import {
NavigationEnd,
Router,
RouterLink,
RouterLinkActive
} from '@angular/router';

import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ApiService, Movie } from '../../services/api';

@Component({
selector: 'app-navbar',
standalone: true,
imports: [
RouterLink,
RouterLinkActive,
FormsModule
],
templateUrl: './navbar.html',
styleUrl: './navbar.css'
})
export class NavbarComponent
implements OnInit, OnDestroy {

isLightMode = false;
isLoggedIn = false;
isProfileMenuOpen = false;
isMobileMenuOpen = false;
isMobileSearchOpen = false;
mobileSearchText = '';
searchMovies: Movie[] = [];

get filteredMobileSearchResults(): Movie[] {
  const query = this.mobileSearchText.trim().toLowerCase();
  if (!query) return [];

  return this.searchMovies
    .filter((movie) =>
      [
        movie.title,
        movie.genre,
        movie.type,
        movie.description
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(query)
      )
    )
    .slice(0, 5);
}

userName = '';
profileImage = '';

private profileUpdateHandler = (event: Event) => {
const customEvent = event as CustomEvent;
const profile = customEvent.detail;


this.zone.run(() => {
  if (!profile) {
    this.loadUser();
    return;
  }

  this.isLoggedIn = true;
  this.userName = profile.name ?? '';
  this.profileImage = profile.profileImage ?? '';

  this.cdr.detectChanges();
});


};

constructor(
private router: Router,
private cdr: ChangeDetectorRef,
private zone: NgZone,
private api: ApiService
) {}

ngOnInit(): void {
this.loadTheme();
this.loadUser();
this.loadSearchMovies();


window.addEventListener(
  'moli-profile-updated',
  this.profileUpdateHandler
);

this.router.events
  .pipe(
    filter(
      (event) =>
        event instanceof NavigationEnd
    )
  )
  .subscribe(() => {
    this.loadTheme();
    this.loadUser();
    this.isProfileMenuOpen = false;
    this.isMobileMenuOpen = false;
    this.cdr.detectChanges();
  });


}

ngOnDestroy(): void {
window.removeEventListener(
'moli-profile-updated',
this.profileUpdateHandler
);
}

loadSearchMovies(): void {
  this.api.getMovies().subscribe({
    next: (movies) => {
      this.searchMovies = movies ?? [];
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Failed to load navbar search movies:', error);
      this.searchMovies = [];
    }
  });
}

toggleMobileMenu(): void {
  this.isMobileMenuOpen = !this.isMobileMenuOpen;
  if (this.isMobileMenuOpen) {
    this.isProfileMenuOpen = false;
    this.isMobileSearchOpen = false;
  }
}

toggleMobileSearch(): void {
  this.isMobileSearchOpen = !this.isMobileSearchOpen;
  if (this.isMobileSearchOpen) {
    this.isMobileMenuOpen = false;
    this.isProfileMenuOpen = false;
  } else {
    this.mobileSearchText = '';
  }
}

closeMobileSearch(): void {
  this.isMobileSearchOpen = false;
  this.mobileSearchText = '';
}

clearMobileSearch(): void {
  this.mobileSearchText = '';
}

loadTheme(): void {
this.isLightMode =
localStorage.getItem('moli_theme') === 'light';


document.body.classList.toggle(
  'light-mode',
  this.isLightMode
);


}

toggleBrightness(): void {
this.isLightMode = !this.isLightMode;


localStorage.setItem(
  'moli_theme',
  this.isLightMode ? 'light' : 'dark'
);

document.body.classList.toggle(
  'light-mode',
  this.isLightMode
);

this.cdr.detectChanges();


}

loadUser(): void {
const token =
localStorage.getItem('moli_token');


const userData =
  localStorage.getItem('moli_user');

this.isLoggedIn = !!token;

if (!userData) {
  this.userName = '';
  this.profileImage = '';
  return;
}

try {
  const user = JSON.parse(userData);

  this.userName = user?.name ?? '';
  this.profileImage =
    user?.profileImage ?? '';

} catch {
  this.userName = '';
  this.profileImage = '';
}


}

toggleProfileMenu(): void {
this.isProfileMenuOpen =
!this.isProfileMenuOpen;
}

closeProfileMenu(): void {
this.isProfileMenuOpen = false;
}

logout(): void {
localStorage.removeItem('moli_token');
localStorage.removeItem('moli_user');


this.isLoggedIn = false;
this.userName = '';
this.profileImage = '';
this.isProfileMenuOpen = false;

this.cdr.detectChanges();

this.router.navigate(['/home']);

}
}
