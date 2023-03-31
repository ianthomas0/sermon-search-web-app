import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Books } from './shared/models';
import { Sermon } from './shared/models/sermon';
import { SearchService } from './shared/search.service';

import { Location } from '@angular/common';

import { Form, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map, startWith } from 'rxjs/operators';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { Book } from './shared/models/book';

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
  public sources: string[] = ['Desiring God'];
  public authors: string[] = [''];
  public filteredBooks: Observable<Book[]>;
  public filteredAuthors: Observable<string[]>;
  public filteredSources: Observable<string[]>;

  public sortFields = [
    { fieldSelector: 'chapter' },
    { fieldSelector: 'verseStart' },
  ];
  public displayedColumns: string[] = ['title'];

  public searchText: string;
  public selectedBook: FormControl = new FormControl();
  public chapter: FormControl = new FormControl();
  public source: FormControl = new FormControl();
  public author: FormControl = new FormControl();

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
    this.searchService.getFilterData().subscribe((data: any) => {
      this.authors = data.authors;
      this.author.patchValue(this.author.value);
      this.sources = data.sources;
      this.source.patchValue(this.source.value);
    });
    this.searched = false;

    let bookParam = this.route.snapshot.queryParams['book'];
    let chapterParam = this.route.snapshot.queryParams['chapter'];
    let sourceParam = this.route.snapshot.queryParams['source'];
    let authorParam = this.route.snapshot.queryParams['author'];

    if (bookParam) {
      let foundBook = this.books.find((book: Book) => book.name === bookParam);
      this.selectedBook.patchValue(foundBook.name);
      this.chapter.patchValue(chapterParam);
      this.source.patchValue(sourceParam);
      this.author.patchValue(authorParam);
      this.searchForBook();
    } else {
      this.searchForBook();
    }

    this.filteredBooks = this.selectedBook.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterBooks(value))
    );

    this.filteredSources = this.source.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterSource(value))
    );

    this.filteredAuthors = this.author.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterAuthor(value))
    );
  }

  public ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  public searchForBook() {
    this.setPathParams(
      this.selectedBook.value,
      this.chapter.value,
      this.source.value,
      this.author.value
    );

    this.loading = true;
    this.searchService
      .searchForBook(
        this.selectedBook.value,
        this.chapter.value,
        this.source.value,
        this.author.value
      )
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
          setTimeout(() => {
            (window as any).refTagger.tag();
          }, 50);
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

  private setPathParams(
    book: string | null,
    chapter: string | null,
    source: string | null,
    author: string | null
  ): void {
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

    if (this.source === null) {
      delete params['source'];
    } else {
      params['source'] = source;
    }

    if (this.author === null) {
      delete params['author'];
    } else {
      params['author'] = author;
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

  private _filterBooks(value: string): Book[] {
    const filterValue = value.toLowerCase();

    return this.books.filter((book) =>
      book.name.toLowerCase().includes(filterValue)
    );
  }

  private _filterSource(value: string): string[] {
    let filterValue = value ? value.toLowerCase() : '';

    return this.sources.filter((source) =>
      source?.toLowerCase().includes(filterValue)
    );
  }

  private _filterAuthor(value: string): string[] {
    let filterValue = value ? value.toLowerCase() : '';

    return this.authors.filter((author) =>
      author?.toLowerCase().includes(filterValue)
    );
  }
}
