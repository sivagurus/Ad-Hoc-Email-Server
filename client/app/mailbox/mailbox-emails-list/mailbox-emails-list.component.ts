import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '../../core/services/api.service';
import {Meta, Title} from '@angular/platform-browser';
import {EmailInfo} from '../../model/email-info-model';
import {Subscription} from 'rxjs/internal/Subscription';
import {ConfigService} from '../../core/services/config.service';

@Component({
  selector: 'app-mailbox-emails',
  templateUrl: './mailbox-emails-list.component.html',
  styleUrls: ['./mailbox-emails-list.component.css']
})
export class MailboxEmailsListComponent implements OnInit, OnDestroy {
  paramsSub: Subscription;
  emailsSub: Subscription;
  mailbox: string;
  selectedEmail: EmailInfo;
  emailId: string;

  constructor(private apiService: ApiService,
      private route: ActivatedRoute,
      private router: Router,
      private titleService: Title,
      private metaService: Meta) {}

  ngOnInit() {
    this.paramsSub = this.route.params.subscribe(params => {
      if (params['mailbox'] == null) {
        this.metaService.updateTag({ name: 'description', content: 'AHEM - mailboxes'});
        this.titleService.setTitle('AHEM - Mailboxes');
      } else {
      }
      this.emailId = params['emailId'];
      if (!this.mailbox || this.mailbox.toLowerCase() !== params['mailbox'].toLowerCase()) {
        this.mailbox = params['mailbox'].toLowerCase();
        this.metaService.updateTag({ name: 'description', content: 'AHEM - ' + this.mailbox});
        this.titleService.setTitle('AHEM - ' + this.mailbox);
        this.apiService.listMailboxEmails(this.mailbox);
      } else {
        this.selectEmail(this.getEmailFromTimeStamp(this.emailId));
      }
    });
    this.emailsSub = this.apiService.emails.subscribe(emails => {
      if (this.emailId) {
        this.selectEmail(this.getEmailFromTimeStamp(this.emailId));
      }
    }, err => {
      this.selectedEmail = null;
      console.error(err);
    });
  }

  ngOnDestroy(): void {
    this.paramsSub.unsubscribe();
    this.emailsSub.unsubscribe();
  }


  selectEmail(emailInfo: EmailInfo) {
    if (emailInfo) {
      if (!emailInfo.isRead) {
        emailInfo.isRead = true;
      }
      this.selectedEmail = emailInfo;
      this.apiService.markAsReadOrUnread(this.mailbox, this.selectedEmail.emailId, true).subscribe();
    }
  }

  private getEmailFromTimeStamp(emailId: string): EmailInfo {
    return this.apiService.emails.value.filter(email => email.emailId === emailId)[0];
  }

  clickedEmail(email: EmailInfo) {
    this.selectEmail(email);
    this.router.navigateByUrl('/mailbox/' + this.mailbox + '/' + email.emailId);
  }

  deleteFile() {
    this.apiService.deleteEmail(this.mailbox, this.selectedEmail.emailId).subscribe(
      result => {
        this.apiService.listMailboxEmails(this.mailbox);
        this.selectedEmail = null;
        this.router.navigateByUrl('/mailbox/' + this.mailbox);
      },
      err => {
        console.log('error!!!!', err); // TODO popup message
      }
    );
  }

  markAsReadOrUnread() {
      if (this.selectedEmail) {
        if (!this.selectedEmail.isRead) {
          this.selectedEmail.isRead = true;
        } else {
          this.selectedEmail.isRead = false;
        }
        this.apiService.markAsReadOrUnread(this.mailbox, this.selectedEmail.emailId, this.selectedEmail.isRead).subscribe();
      }
  }

  getEmptyMailboxText(): string {
    return this.mailbox + '@' + ConfigService.properties.allowedDomains[0];
  }

  navigateToMailbox() {
    this.router.navigateByUrl('mailbox/' + this.mailbox);
  }

}
