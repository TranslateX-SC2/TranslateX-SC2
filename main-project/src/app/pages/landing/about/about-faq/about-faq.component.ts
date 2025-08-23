import {Component} from '@angular/core';
import {IonAccordion, IonAccordionGroup, IonItem, IonLabel} from '@ionic/angular/standalone';

@Component({
  selector: 'app-about-faq',
  templateUrl: './about-faq.component.html',
  styleUrls: ['./about-faq.component.scss'],
  imports: [IonAccordionGroup, IonAccordion, IonItem, IonLabel],
})
export class AboutFaqComponent {
  questions = [
    {
      question: 'What is TranslateX, and how does it work?',
      answer:
        'TranslateX is an AI-driven platform that provides real-time sign language translation between spoken and signed languages. Through our API, businesses and organizations can instantly translate text or speech into sign language, creating accessible communication for Deaf users. This ensures inclusivity and a seamless experience for everyone.',
    },
    {
      question: 'How does TranslateX help businesses and organizations?',
      answer:
        'TranslateX enables businesses and organizations to become more inclusive and compliant with accessibility standards. By integrating our API, companies can offer real-time sign language translation for Deaf customers, employees, and partners, improving communication, customer satisfaction, and brand reputation. This also helps align with ESG goals and enhances accessibility efforts.',
    },
    {
      question: 'How many languages does TranslateX support?',
      answer:
        'TranslateX currently supports over 40 signed and spoken languages, allowing for flexible, real-time translation between a wide variety of languages used by Deaf and hearing individuals. These languages are available at different levels of quality, but we are constantly improving and refining our translations. We are committed to delivering a high standard and continue to expand and enhance our language offerings to meet diverse communication needs.',
    },
   
  ];
}
