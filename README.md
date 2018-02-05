# hero-contracts

**TGE (ICO) контракты для проведения открытого размещения токенов**

**Спецификация**

Задание на открытое размещение проекта **Ethernal Heroes**:
Предполагается продажа токенов **MAGE**.
Стоиомость одного токена **MAGE** - **$0.05**. Набор параметров:

- Soft Cap **$2 000 000**
- Hard Cap **$5 000 000**
- Даты Presale: **1 февраля 2018г - 15 марта 2018г**
- Даты TGE **16 марта 2018г - 31 мая 2018г**

Hard Cap и Soft Cap могут быть изменены владельцем контракта. Даты Presale и TGE могут быть изменены владельцем контракта.

- Должна быть предусмотрена возможность указать текущий курс **ETH** в центах
- Общее количество токенов - **155 000 000**
- Количество токенов, предназначенных для продажи - **100 000 000**
- **55 000 000** токенов, в случае успешного проведения TGE будут распределены на специально подготовленные аккаунты следующим образом:
-- Команде - **15 000 000** 
-- Адвайзерам - **3 000 000** 
-- На реферальную систему - **2 000 000** 
-- Резерв - **35 000 000**

Во время проведения Presale токенами можно свободно обмениваться. Средства полученные во время проведения Presale, переводятся на специальный аккаунт и не возвращаются в случае включения режима возврата средств. 
Во время проведения TGE токенами можно свободно обмениваться, однако, в случае не набора Soft Cap, после включения режима возврата средств, решение о возврате средств будет приниматься в индивидуальном порядке. В таком случае, средства, полученные от инвестора будут переводиться на специальный аккаунт, который может изменить владелец контракта, до момента финализации TGE
После окончания срока проведения, перевод средств на адрес контракта будет невозможен.

- Контракт продаж должен поддерживать прием средств, которые до успешного окончания TGE должны размещаться на специальном хранилище, доступ к которому есть только у контракта продаж. В случае досижения Soft Cap и финализации TGE, собранные средства должны поступать на специальный аккаунт, который задается в настройках деплоя контрактов и его может изменить владелец контракта до момента финализации TGE
- Должна быть предусмотрена возможность остановить/возобновить продажи. Во время остановки продаж, продажа токенов должна быть остановлена и доступна только владельцу контракта
- У покупателей токенов должна быть возможность подключить к своему кошельку контракт токена и наблюдать за своим счетом токенов
- Должны быть предусмотрены функции перевода токенов миную TGE Policy и отражения покупки токенов в альтернативной валюте
- Должна быть возможность включить режим возврата средств
- После окончания TGE, владельцу контракта должна быть предоставлена возможность добросить средства на контракт, затем финализировать TGE или принять решение о включении режима возврата средств. Финализировать TGE можно только 1 раз

При покупке токенов должне быть предусмотрен бонус, который зависит от кол-ва проданных токенов и вычисляется следующим образом:
1. от **0** до **10 000 000** токенов, бонус **20%** (не включительно)
2. от **10 000 000** до **25 000 000** токенов, бонус **15%** (не включительно)
3. от **25 000 000** до **50 000 000** токенов, бонус **10%** (не включительно)
4. от **50 000 000** до **75 000 000** токенов, бонус **5%** (не включительно)
5. **> 75 000 000** токенов, бонус отсутствует

**Установка и тестирование**

Необходимо установить:

- Node.js и NPM: https://nodejs.org/en/download/
- Truffle: https://www.npmjs.com/package/truffle
- Test RPC: https://github.com/ethereumjs/testrpc

Далее:
- Склонировать проект: **$ git clone https://github.com/EthernalHeroes/hero-contracts**
- Перейти в папку с проектом: **$ cd hero-contracts/**
- Выполнить: **$ npm install**
- Запустить Test RPC: **$ testrpc**

Для testrpc, необходимо установить следующие параметры для тестовых аккаунтов:
--account="0x2f9b8503ce21fbe908fc0ec55db3b389337c91d1671b93eb717ea1b935c1f498,100000000000000000000000" --account="0x59fd18910feae5a66c807690883133d46124655cfcf3a73e8ab9394960115542,100000000000000000000000" --account="0xb104e59390779b5654141ba1d7ba96aaf19efd8656cae9a92059d55cd333fde2,100000000000000000000000" --account="0x12ae9d7f4eeeb603515de2d2d85f4e4664014ffc83e4838b0663abd7b79869e3,100000000000000000000000" --account="0xede98b10900a143c659d4bfa0a82f78c7a63ed7bc26b5fccfc41d8bd9e80f3aa,100000000000000000000000" --account="0x433ca4ea4bab9c0d3136e26e8010f5fe19eb5bcc54816616d4d3689ebc34a2d2,100000000000000000000000" --account="0x30e05cf00c12e867012c30026ec90d738fca1bf8e623c4c951c04674aa294c02,100000000000000000000000" --account="0x8dcf931ce42b001ed060b37a0c38294c9ce2ec2423c7c4e0815a44841e12a7e1,100000000000000000000000" --account="0xce968b9c7ed25b4de22d87f56dfdfa01d9a4a1c76a3e4a14b5c93047ff523746,100000000000000000000000" --account="0xe74293bf0db72a9ef442759b19119086bd1bdcb3914ab331397ec8472259ac02,0" -u 0 -u 1 -u 3 -u 3 -u 4 -u 5 -u 6 -u 7 -u 8 -u 9

Для деплоя выполнить: **$ truffle migrate**

Для выполнения тестов выполнить: **$ truffle test**


