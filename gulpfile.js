var gulp = require('gulp');
var postcss = require('gulp-postcss');
var browserSync = require('browser-sync');
var del = require('del');
var rename = require('gulp-rename');
var cssnano = require('cssnano');
var stylelint = require('gulp-stylelint');
var eslint = require('gulp-eslint');
var uglify = require('gulp-uglify');
var ghPages = require('gulp-gh-pages');

var project = {
	src: 'dev',
	build: 'build',
	css: {
		src: 'dev/pcss/main.pcss',
		build: 'main.css',
		dir: 'dev/pcss/',
	},
	js: {
		src: 'dev/js',
		build: 'build/js',
	},
};

function handleError(err) {
	console.log(err.toString()); // eslint-disable-line no-console
	this.emit('end');
}

gulp.task('clean', function () {
	return del([project.build + '/**/*'], {
		dot: true,
	});
});

var processors = [
	require('postcss-import')(),
	require('postcss-nested')(),
	require('postcss-simple-vars')(),
	require('postcss-calc')(),
	require('postcss-hexrgba')(),
	require('autoprefixer')({
		browsers: ['last 2 versions', '> 1%', 'Android >= 4', 'iOS >= 8'],
	}),
];

gulp.task('styles:default', function () {
	return gulp.src(project.css.src)
		.pipe(postcss(processors))
		.on('error', handleError)
		.pipe(rename(project.css.build))
		.pipe(gulp.dest(project.build))
		.pipe(browserSync.stream());
});

gulp.task('styles:minify', function () {
	return gulp.src(project.build + '/' + project.css.build)
		.pipe(postcss([
			cssnano({
				autoprefixer: false,
				calc: false,
				colormin: true,
				convertValues: false,
				core: true,
				discardComments: true,
				discardDuplicates: true,
				discardEmpty: true,
				discardOverridden: true,
				discardUnused: true,
				filterOptimiser: true,
				functionOptimiser: true,
				mergeIdents: true,
				mergeLonghand: true,
				mergeRules: false,
				minifyFontValues: true,
				minifyGradients: true,
				minifyParams: true,
				minifySelectors: true,
				normalizeCharset: true,
				normalizeUrl: true,
				orderedValues: false,
				reduceBackgroundRepeat: true,
				reduceInitial: true,
				reduceIdents: true,
				reducePositions: true,
				reduceTimingFunctions: true,
				reduceTransforms: true,
				uniqueSelectors: true,
				zindex: false,
			}),
		]))
		.on('error', handleError)
		.pipe(gulp.dest(project.build));
});

gulp.task('styles:lint', function () {
	return gulp.src(project.css.dir + '*.pcss')
		.pipe(stylelint({
			failAfterError: false,
			reporters: [
				{
					formatter: 'string',
					console: true,
				},
			],
		}));
});

gulp.task('styles',
	gulp.series(
		'styles:default',
		'styles:minify'
	)
);

gulp.task('js:lint', function () {
	return gulp.src([project.js.src + '/*.js', './gulpfile.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('js:minify', function () {
	return gulp.src(project.js.src + '/*.js')
		.pipe(uglify())
		.pipe(gulp.dest(project.js.build));
});

gulp.task('copy:html', function () {
	return gulp.src(project.src + '/*.html', { since: gulp.lastRun('copy:html') })
		.pipe(gulp.dest(project.build))
		.pipe(browserSync.stream());
});

gulp.task('copy:js', function () {
	return gulp.src(project.js.src + '/*.js', { since: gulp.lastRun('copy:js') })
		.pipe(gulp.dest(project.js.build))
		.pipe(browserSync.stream());
});

gulp.task('copy',
	gulp.parallel(
		'copy:html',
		'copy:js'
	)
);

gulp.task('server', function () {
	browserSync.init({
		server: {
			baseDir: project.build,
		},
		notify: false,
		online: false,
		ghostMode: false,
	});
});

gulp.task('watch', function () {
	gulp.watch([
		project.css.dir + '/*.pcss',
	], gulp.series('styles:default'));

	gulp.watch([
		project.js.src + '/*.js',
	], gulp.series('copy:js'));

	gulp.watch([
		project.src + '/*.html',
	], gulp.series('copy:html'));
});

gulp.task('default',
	gulp.series(
		gulp.parallel(
			'styles:default',
			'copy'
		),
		gulp.parallel(
			'server',
			'watch'
		)
	)
);

gulp.task('build',
	gulp.series(
		'clean',
		gulp.parallel(
			gulp.series(
				'styles:default',
				'styles:minify'
			),
			'copy:html',
			'js:minify'
		)
	)
);

gulp.task('lint',
	gulp.parallel(
		'styles:lint',
		'js:lint'
	)
);

gulp.task('upload', function () {
	return gulp.src(project.build + '/**/*')
		.pipe(ghPages());
});

gulp.task('deploy',
	gulp.series(
		'build',
		'upload'
	)
);
