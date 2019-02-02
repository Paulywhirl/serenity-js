import { Ensure, equals } from '@serenity-js/assertions';
import { Actor } from '@serenity-js/core';
import { by, protractor } from 'protractor';

import { BrowseTheWeb, Navigate, Target, Text } from '../../../src';
import { pageFromTemplate } from '../../fixtures';

describe('Text', function() {

    const Bernie = Actor.named('Bernie').whoCan(
        BrowseTheWeb.using(protractor.browser),
    );

    describe('of', () => {

        /** @test {Text} */
        /** @test {Text.of} */
        it('allows the actor to read the text of the DOM element matching the locator', () => Bernie.attemptsTo(
            Navigate.to(pageFromTemplate(`
                <html>
                <body>
                    <h1>Hello World!</h1>
                </body>
                </html>
            `)),

            Ensure.that(Text.of(Target.the('header').located(by.tagName('h1'))), equals('Hello World!')),
        ));
    });

    describe('ofAll', () => {

        /** @test {Text} */
        /** @test {Text.ofAll} */
        it('allows the actor to read the text of all DOM elements matching the locator', () => Bernie.attemptsTo(
            Navigate.to(pageFromTemplate(`
                <html>
                <body>
                    <h1>Shopping list</h1>
                    <ul>
                        <li>milk</li>
                        <li>oats</li>
                    </ul>
                </body>
                </html>
            `)),

            Ensure.that(Text.ofAll(Target.all('shopping list items').located(by.css('li'))), equals(['milk', 'oats'])),
        ));
    });
});