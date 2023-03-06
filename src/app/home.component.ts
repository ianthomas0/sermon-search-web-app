import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SearchService } from './shared/search.service';
import { Sermon } from './shared/models/sermon';
import { Books } from './shared/models';
import { BehaviorSubject, Observable, pipe } from 'rxjs';

import { Location } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import { Book } from './shared/models/book';
import { FormControl } from '@angular/forms';
import { finalize, map, startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'my-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, AfterViewInit {
  public sermons: BehaviorSubject<Sermon[]> = new BehaviorSubject<Sermon[]>([]);
  public searched: boolean;
  public books: Book[] = Books.books;
  public filteredBooks: Observable<Book[]>;

  public sortFields = [
    { fieldSelector: 'chapter' },
    { fieldSelector: 'verseStart' },
  ];
  public displayedColumns: string[] = ['title'];

  public searchText: string;
  public selectedBook: FormControl = new FormControl();
  public chapter: FormControl = new FormControl();

  public loading: boolean = false;

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private dialog: MatDialog
  ) {}

  public dataSource = new MatTableDataSource<Sermon>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  public ngOnInit(): void {
    this.searched = false;

    let bookParam = this.route.snapshot.queryParams['book'];
    let chapterParam = this.route.snapshot.queryParams['chapter'];

    if (bookParam) {
      let foundBook = this.books.find((book: Book) => book.name === bookParam);
      this.selectedBook.patchValue(foundBook.name);
      this.chapter.patchValue(chapterParam);
      this.searchForBook();
    }

    this.filteredBooks = this.selectedBook.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );
  }

  public ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public searchForBook() {
    this.setPathParams(this.selectedBook.value, this.chapter.value);

    this.loading = true;
    this.searchService
      .searchForBook(this.selectedBook.value, this.chapter.value)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (response: Sermon[]) => {
          this.dataSource.data = response;
          this.sermons.next(response);
          this.searched = true;
          window.refTaggerCallback();
        },
        (error: any) => {
          this.openErrorDialog();
        }
      );
  }

  public openErrorDialog() {
    this.dialog.open(ErrorDialogComponent);
  }

  private getPathParams(): any {
    const params: any = {};

    const path = this.location.path();
    if (path.indexOf('?') === -1) {
      return params;
    }

    const existingParamPairs = path.split('?')[1].split('&');
    existingParamPairs.forEach((pair) => {
      const fragments = pair.split('=');
      params[fragments[0]] = fragments[1];
    });

    return params;
  }

  private setPathParams(book: string | null, chapter: string | null): void {
    const params = this.getPathParams();

    if (book === null) {
      delete params['book'];
    } else {
      params['book'] = book;
    }

    if (chapter === null) {
      delete params['chapter'];
    } else {
      params['chapter'] = chapter;
    }

    // Update the URL without triggering a navigation state change.
    // See: https://stackoverflow.com/a/46486677
    const url = this.router
      .createUrlTree(['.'], {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: 'merge',
      })
      .toString();

    this.location.go(url);
  }

  private _filter(value: string): Book[] {
    const filterValue = value.toLowerCase();

    return this.books.filter((book) =>
      book.name.toLowerCase().includes(filterValue)
    );
  }
}
