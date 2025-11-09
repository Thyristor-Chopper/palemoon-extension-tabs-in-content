const Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
Cu.import('resource://gre/modules/Services.jsm');

function processWindows(callback) {
	const windows = Services.wm.getEnumerator('navigator:browser');
	while(windows.hasMoreElements())
		callback(windows.getNext());
}

function moveTabs(window) {
	if(window.document.querySelector('window#main-window[chromehidden~="location"]')) return;
	var tabsToolbar = window.document.getElementById('TabsToolbar');
	window.document.getElementById('appcontent').prepend(tabsToolbar);
	tabsToolbar.style.setProperty('-moz-box-ordinal-group', '0', 'important');
}

function restoreTabs(window) {
	var tabsToolbar = window.document.getElementById('TabsToolbar');
	window.document.getElementById('navigator-toolbox').insertBefore(tabsToolbar, window.document.getElementById('status-bar'));
	tabsToolbar.style.removeProperty('-moz-box-ordinal-group');
}

const observers = {
	windowOpened: {
		observe(subject, topic, data) {
			subject.addEventListener('load', function onload() {
				subject.removeEventListener('load', onload, false);
				if(subject.document.documentElement.getAttribute('windowtype') == 'navigator:browser')
					moveTabs(subject);
			}, false);
		},
		register() {
			Services.obs.addObserver(this, 'domwindowopened', false);
		},
		unregister() {
			Services.obs.removeObserver(this, 'domwindowopened');
		},
	},
};

function startup(data, reason) {
	observers.windowOpened.register();
	processWindows(moveTabs);
}

function shutdown(data, reason) {
	observers.windowOpened.unregister();
	processWindows(restoreTabs);
}

function install() {}

function uninstall() {}
