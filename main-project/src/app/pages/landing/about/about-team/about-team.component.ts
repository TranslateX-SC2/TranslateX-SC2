import {Component} from '@angular/core';
import {IonAvatar, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle} from '@ionic/angular/standalone';

@Component({
  selector: 'app-about-team',
  templateUrl: './about-team.component.html',
  styleUrls: ['./about-team.component.scss'],
  imports: [IonCard, IonBadge, IonCardHeader, IonAvatar, IonCardTitle, IonCardContent],
})
export class AboutTeamComponent {
  teamMembers = [
    {
      name: 'Anuj Kaushal',
      avatar: 'assets/promotional/about/team/anuj1.jpeg',
      title: 'Member',
      bio: 'AI-Engineer',
    },
    {
      name: 'Raman Sah',
      avatar: 'assets/promotional/about/team/raman1.jpeg',
      title: 'Member',
      bio: 'Angular Developer',
    },
    {
      name: 'Sumanta Patra',
      avatar: 'assets/promotional/about/team/sumanta1.jpeg',
      title: 'Member',
      bio: 'AI-ML Engineer',
    },
    {
      name: 'Ritik Aryan',
      avatar: 'assets/promotional/about/team/ritik1.jpeg',
      title: 'Member',
      bio: 'Backend Developer',
    },
    {
      name: 'Samriddho Biswas',
      avatar: 'assets/promotional/about/team/samriddho1.jpeg',
      title: 'Member',
      bio: 'Frontend Developer',
    },
  ];
}
