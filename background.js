const browser = globalThis.browser ?? globalThis.chrome;

async function getCurrentWindow() {
	try {
		return await browser.windows.getCurrent();
	} catch (error) {
		console.error("Error getting current window:", error);
		throw error;
	}
}

async function getTabsInOtherWindows() {
	try {
		const [normalTabs, popupTabs] = await Promise.all([
			browser.tabs.query({ currentWindow: false, windowType: "normal" }),
			browser.tabs.query({ currentWindow: false, windowType: "popup" }),
		]);
		return [...normalTabs, ...popupTabs];
	} catch (error) {
		console.error("Error querying tabs:", error);
		throw error;
	}
}

function filterUngroupedTabs(tabs) {
	return tabs.filter((tab) => tab.groupId === -1);
}

async function moveTabs(tabs, windowId) {
	try {
		await browser.tabs.move(
			tabs.map((tab) => tab.id),
			{ windowId, index: -1 },
		);
	} catch (error) {
		console.error("Error moving tabs:", error);
		throw error;
	}
}

async function updatePinnedStatus(tabs) {
	for (const tab of tabs) {
		if (tab.pinned) {
			try {
				await browser.tabs.update(tab.id, { pinned: true });
			} catch (error) {
				console.error(`Error updating pinned status for tab ${tab.id}:`, error);
				// Continue with other tabs even if one fails
			}
		}
	}
}

const onClick = async () => {
	try {
		const currentWindow = await getCurrentWindow();
		const allTabs = await getTabsInOtherWindows();

		if (!allTabs || allTabs.length === 0) {
			console.log("No tabs found in other windows");
			return;
		}

		const ungroupedTabs = filterUngroupedTabs(allTabs);

		if (ungroupedTabs.length === 0) {
			console.log("No ungrouped tabs found");
			return;
		}

		await moveTabs(ungroupedTabs, currentWindow.id);
		await updatePinnedStatus(ungroupedTabs);

		console.log(
			`Successfully moved ${ungroupedTabs.length} tabs to the current window`,
		);
	} catch (error) {
		console.error("An error occurred in the onClick handler:", error);
	}
};

browser.action.onClicked.addListener(onClick);
