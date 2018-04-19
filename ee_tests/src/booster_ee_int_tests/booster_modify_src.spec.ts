import { browser, Key, protractor, element, by, ExpectedConditions as until, $, $$ } from 'protractor';
import { WebDriver, error as SE } from 'selenium-webdriver';
import * as support from '../support';
import { Quickstart } from '../support/quickstart';
import { TextInput, Button } from '../ui';

import { LandingPage } from '../page_objects/landing.page';
import { SpaceDashboardPage } from '../page_objects/space_dashboard.page';
import { SpacePipelinePage } from '../page_objects/space_pipeline.page';
import { MainDashboardPage } from '../page_objects/main_dashboard.page';
import { StageRunPage } from '../page_objects/space_stage_run.page';
import { SpaceChePage } from '../page_objects/space_che.page';
import { BoosterEndpoint } from '../page_objects/booster_endpoint.page';
import { SpaceCheWorkspacePage } from '../page_objects/space_cheworkspace.page';
import { info } from '../support';
import * as ui from '../ui';

let globalSpaceName: string;
let globalSpacePipelinePage: SpacePipelinePage;
const SRCFILENAME: string = 'HttpApplication.java';

/* Text used to verify operation of deployed app, before and after the app is modified */
const EXPECTED_TEXT_AFTER_SEND = 'Howdee, World';
const EXPECTED_TEXT_AFTER_RECEIVED = 'Howdee, Howdee, World!';
const EXPECTED_SUCCESS_TEXT = 'Succeeded in deploying verticle';  // TODO - Need unique string for each booster

const REDEPLOY_TEXT_1 = 'Changes detected - recompiling the module';
const REDEPLOY_TEXT_2 = 'INFO: Redeploying';
const REDEPLOY_TEXT_3 = 'INFO: Redeployment done';

// tslint:disable:max-line-length

/* This test performs these steps:
   - Execute the quickstart/booster through the Che run menu, verify output from the deployed app
   - Update the source of the quickstart/booster
   - Execute the quickstart/booster through the Che run menu, verify output from the deployed app   */

describe('Modify the project source code in Che:', () => {
  let dashboardPage: MainDashboardPage;

  beforeEach(async () => {
    await support.desktopTestSetup();
    let login = new support.LoginInteraction();
    dashboardPage = await login.run();
  });

  afterEach(async () => {
    support.writeScreenshot('target/screenshots/booster_modify_src_complete.png');
    await dashboardPage.logout();
  });

  it('Login, edit code in Che, logout', async () => {
    support.info('Che edit test starting now...');

    /* Part 1 - Run the app, verify the deployed app performs as expected */

    /* Open the codebase page and the workspace in Che */
    await support.openCodebasesPage (browser.params.target.url, browser.params.login.user, support.currentSpaceName());
    let spaceChePage = new SpaceChePage();
    await spaceChePage.codebaseOpenButton(browser.params.login.user, support.currentSpaceName()).clickWhenReady();

    /* A new browser window is opened when Che opens */
    let handles = await browser.getAllWindowHandles();
    support.writeScreenshot('target/screenshots/che_edit_open_che_' + support.currentSpaceName() + '.png');
    await browser.wait(support.windowCount(handles.length), support.DEFAULT_WAIT);
    handles = await browser.getAllWindowHandles();
    support.debug('Number of browser tabs after opening Che browser window = ' + handles.length);

    /* Switch to the Che browser window */
    await browser.switchTo().window(handles[handles.length - 1]);
    let spaceCheWorkSpacePage = new SpaceCheWorkspacePage();

    /* Find the project in the project tree */
    let projectInCheTree = new Button(spaceCheWorkSpacePage.recentProjectRootByName(support.currentSpaceName()),'Project in Che Tree');
    await projectInCheTree.untilPresent(support.LONGEST_WAIT);
    support.writeScreenshot('target/screenshots/che_edit_project_tree_' + support.currentSpaceName() + '.png');

    await support.runBooster(spaceCheWorkSpacePage, EXPECTED_SUCCESS_TEXT);
    await projectInCheTree.untilPresent(support.LONGEST_WAIT);
    projectInCheTree.clickWhenReady();

    /* Disable param and braces - to avoid introducing extra characters */
    await support.togglePreferences(spaceCheWorkSpacePage);

    /* Locate the file in the project tree */
    try {
      await spaceCheWorkSpacePage.walkTree(support.currentSpaceName(), '\/src', '\/main', '\/java', '\/io', '\/openshift', '\/booster');
      await browser.wait(until.visibilityOf(spaceCheWorkSpacePage.cheFileName(SRCFILENAME)), support.DEFAULT_WAIT);
    } catch (e) {
      support.info('Exception in Che project directory tree = ' + e);
  }

    /* Modify the deployed app source code */
    let theText = await spaceCheWorkSpacePage.cheFileName(SRCFILENAME).getText();
    support.info ('filename = ' + theText);
    await spaceCheWorkSpacePage.cheFileName(SRCFILENAME).clickWhenReady();

    /* Right click on file name */
    await browser.actions().click(spaceCheWorkSpacePage.cheFileName(SRCFILENAME), protractor.Button.RIGHT).perform();

    /* Open the file edit menu */
    await spaceCheWorkSpacePage.cheContextMenuEditFile.clickWhenReady();

    /* Replace the file contents */
    try {
      await spaceCheWorkSpacePage.cheText.clickWhenReady(support.LONG_WAIT);
      await spaceCheWorkSpacePage.cheText.sendKeys('text was', Key.CONTROL, 'a', Key.NULL, support.FILETEXT);
      await spaceCheWorkSpacePage.cheMenuEdit.clickWhenReady(support.LONG_WAIT);
      await spaceCheWorkSpacePage.cheEditFormat.clickWhenReady(support.LONG_WAIT);
    } catch (e) {
     support.info('Exception in writing to file in Che = ' + e);
    }
    support.writeScreenshot('target/screenshots/che_workspace_part_edit_' + support.currentSpaceName() + '.png');

    /* Close the editor window and select the project in the project tree */
    await browser.switchTo().window(handles[1]);

    await browser.wait(until.textToBePresentInElement(spaceCheWorkSpacePage.bottomPanelCommandConsoleLines,
      REDEPLOY_TEXT_1), support.LONGER_WAIT);
    await browser.wait(until.textToBePresentInElement(spaceCheWorkSpacePage.bottomPanelCommandConsoleLines,
      REDEPLOY_TEXT_2), support.LONGER_WAIT);
    await browser.wait(until.textToBePresentInElement(spaceCheWorkSpacePage.bottomPanelCommandConsoleLines,
      REDEPLOY_TEXT_3), support.LONGER_WAIT);

    await projectInCheTree.untilPresent(support.LONGEST_WAIT);
    projectInCheTree.clickWhenReady();

    /* Run the app, verify the deployed app performs as expected */
    /* Run the project - verify the output from the deployed (in Che preview) serviceendpoint */

    /* Invoke the deployed app at its endpoint, verify the app's output */
    let boosterEndpointPage = new BoosterEndpoint();
    await support. invokeApp (boosterEndpointPage, spaceCheWorkSpacePage, browser.params.oso.username,
      'post_edit', EXPECTED_TEXT_AFTER_SEND, EXPECTED_TEXT_AFTER_RECEIVED, spaceCheWorkSpacePage);

    /* Close the Endpoint window */
    await browser.close();

    /* Close the Che window */
    handles = await browser.getAllWindowHandles();
    await browser.switchTo().window(handles[handles.length - 1]);
    await spaceCheWorkSpacePage.bottomPanelRunTabCloseButton.clickWhenReady();
    await spaceCheWorkSpacePage.bottomPanelRunTabOKButton.clickWhenReady();

    /* Re-enable preferences */
    await support.togglePreferences(spaceCheWorkSpacePage);
    await browser.close();

    /* Switch back to the OSIO window */
    await browser.switchTo().window(handles[0]);

  });

});