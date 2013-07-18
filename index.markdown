<head>
	<link href='http://fonts.googleapis.com/css?family=Inconsolata:400,700' rel='stylesheet' type='text/css'>
	<link href='http://itsjoesullivan.github.io/flat.css/index.css' rel='stylesheet' type='text/css'>
	<link href='http://fonts.googleapis.com/css?family=Merriweather+Sans:400,800' rel='stylesheet' type='text/css'>
	<style>
		html, body {
			position:relative;
			height: 100%;
		}
		body {
			position:relative;
			background-color: #ccc;
		}
		.content {
			position:relative;
			height: 100%;
		}
		h1, h2, h3 {
			font-weight: 700;
			font-family: 'Merriweather Sans', sans-serif;
			text-transform: none;
		}
		#vim {
			position:relative;
			height:40%;
			background-color:#111;
			border-radius: 3px;
			padding: 10px;
		}
	</style>
</head>
<body>

<div class="content w60">

<h1>js-ViM</h1>
<h2>To bring the popular vi clone to the web</h2>



<pre id='vim'></pre>

It's likely that the future of applications is online. 

Alan Kay on the web
Bill Gates on the web
Who wrote about thin clients?

Web the World Forward

Why is ViM a good 

Today's argument in favor of thin-clients is not a prediction but the reality of cloud services. We store our code online. Microsoft Office has been replaced by Google Docs. 

- Among the most popular tools in the developer toolchain, used by a significant portion of developers.
	- The net gain of having ViM online is large
- *Designed* to work in slow environments.
- ViM itself began as a clone of vi.

What do we get?

- Use ViM for day-to-day editing tasks
	- google docs
	- gmail
	- you name it
- Use ViM in new development environments
	- GitHub
	- Cloud9

</div>


	<script src='./vim.js'></script>
	<script>
		var el = document.getElementById('vim'),
			text = el.innerHTML
				.replace('<','&lt;')
				.replace('>','&gt;');
			el.innerHTML = '';

		vim.edit({
			el: document.getElementById('vim')
		});

		vim.text(text);

		vim.exec('G')
		vim.exec('$')
	</script>
</body>
