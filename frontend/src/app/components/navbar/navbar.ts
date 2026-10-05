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

@Component({
selector: 'app-navbar',
standalone: true,
imports: [
RouterLink,
RouterLinkActive
],
templateUrl: './navbar.html',
styleUrl: './navbar.css'
})
export class NavbarComponent
implements OnInit, OnDestroy {

isLightMode = false;
isLoggedIn = false;
isProfileMenuOpen = false;

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
private zone: NgZone
) {}

ngOnInit(): void {
this.loadTheme();
this.loadUser();


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
    this.cdr.detectChanges();
  });


}

ngOnDestroy(): void {
window.removeEventListener(
'moli-profile-updated',
this.profileUpdateHandler
);
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
