import {Component, inject, OnInit} from '@angular/core';
import {Store} from '@ngxs/store';
import {HttpClient} from '@angular/common/http';
import {takeUntil, tap} from 'rxjs/operators';
import {BaseComponent} from '../../../components/base/base.component';
import {IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {TranslateInputButtonComponent} from '../input/button/button.component';
import {LanguageSelectorsComponent} from '../language-selectors/language-selectors.component';
import {SendFeedbackComponent} from '../send-feedback/send-feedback.component';
import {TranslocoPipe} from '@jsverse/transloco';
import {NtkmeButtonModule} from '@ctrl/ngx-github-buttons';
import {SpokenToSignedComponent} from '../spoken-to-signed/spoken-to-signed.component';
import {SignedToSpokenComponent} from '../signed-to-spoken/signed-to-spoken.component';
import {DropPoseFileComponent} from '../drop-pose-file/drop-pose-file.component';
import {addIcons} from 'ionicons';
import {cloudUpload, language, videocam} from 'ionicons/icons';
import {RouterLink} from '@angular/router';
import {LogoComponent} from '../../../components/logo/logo.component';
import {IonInput} from '@ionic/angular/standalone';
import {FormsModule} from '@angular/forms';

// ✅ Import the action from your translate module
import {SetSpokenLanguageText} from '../../../modules/translate/translate.actions';

@Component({
  selector: 'app-translate-desktop',
  templateUrl: './translate-desktop.component.html',
  styleUrls: ['./translate-desktop.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonContent,
    IonTitle,
    TranslateInputButtonComponent,
    IonInput,
    LanguageSelectorsComponent,
    SendFeedbackComponent,
    TranslocoPipe,
    SpokenToSignedComponent,
    SignedToSpokenComponent,
    DropPoseFileComponent,
    IonButton,
    RouterLink,
    LogoComponent,
    FormsModule
  ],
})
export class TranslateDesktopComponent extends BaseComponent implements OnInit {
  private store = inject(Store);
  private http = inject(HttpClient);

  spokenToSigned$ = this.store.select<boolean>(state => state.translate.spokenToSigned);
  showInputBox: boolean = false;
  spokenToSigned: boolean;
  inputText: string = '';
  transcriptList: any[] = [];

  constructor() {
    super();
    addIcons({language, videocam, cloudUpload});
  }

  ngOnInit(): void {
    this.spokenToSigned$
      .pipe(
        tap(spokenToSigned => (this.spokenToSigned = spokenToSigned)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  toggleInputBox() {
    this.showInputBox = !this.showInputBox;
  }

  toggleInputclose() {
    window.location.reload();
  }

  submited_action() {
  const url = 'http://127.0.0.1:8000/youtube_transcript/';

  const payload = {
    video: this.inputText
  };

  this.http.post<any>(url, payload).subscribe({
    next: response => {
      console.log('POST request successful:', response);

      // Save for UI if needed
      this.transcriptList = response.transcript;

      // ✅ Send each transcript item one by one with 20s delay
      if (Array.isArray(response.transcript)) {
        response.transcript.forEach((item: any, index: number) => {
          const text = item.text ?? String(item);

          setTimeout(() => {
            console.log(`Dispatching transcript item ${index + 1}:`, text);
            this.store.dispatch(new SetSpokenLanguageText(text));
          }, index * 20000); // 20s gap per item
        });
      } else {
        // fallback if it's not an array
        this.store.dispatch(new SetSpokenLanguageText(String(response.transcript)));
      }

      alert(`Transcript fetching started. Items will dispatch every 20s.`);
    },
    error: error => {
      console.error('Error in POST request:', error);
      alert('Failed to fetch the transcript.');
    },
  });
}

}
