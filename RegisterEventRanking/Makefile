build-RegisterEventRankingFunction:
	DENO_DIR=.deno_dir deno cache App.ts
	cp -R .deno_dir/gen/file$(CURDIR)/ .deno_dir/LAMBDA_TASK_ROOT
