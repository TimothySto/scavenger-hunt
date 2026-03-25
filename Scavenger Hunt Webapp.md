Scavenger Hunt Webapp Features:

* Landing Page:  
  * QR code scan which links to a hosted webpage with short brief for the scavenger hunt  
  * Interactive button to initiate the scavenger hunt; optional (public) nickname  
  * Opt in for public scoreboard  
  * Redirect to Scavenger Hunt Homepage after signup  
* Scavenger Hunt Homepage:  
  * Scavenger hunt recovery code \- with prompt to screenshot as backup  
  * Checkpoint list:  
    * List of checkpoints with score provided for each checkpoint / interaction  
  * Click through links for any online only checkpoints (Online only sponsors / exhibits)  
  * Any featured sponsors  
* Checkpoints:  
  * Onsite sponsors:  
    * QR code at each table, hunt participants scan to log visit  
    * Hosted page logs visit, shows points gained, optional sponsor blurb, then redirects to sponsor webpage (Delayed automatic with click through backup)  
  * Offsite sponsors:  
    * QR code included in sponsor materials, or provided near materials  
      * Fallback option of online sponsor list, with click through links to sponsor sites which participants can use to gain score.  
    * Otherwise same UX as onsite sponsors  
  * Exhibits:  
    * QR code at exhibits, or interactable list of exhibits on Scavenger Hunt Homepage, or a question which can be answered by reading the exhibit details  
* Prize redemption:  
  * QR code redirecting to landing page which displays their current score, with interactable option to complete the scavenger hunt.  
  * Once hunters choose to end the scavenger hunt they are redirected to final landing page which marks them as complete and displays their “final score” under a banner, allowing for them to redeem prizes.  
* Admin Pannel:  
  * Dashboard views:  
    * Checkpoint dashboard:  
      * “Total collections”  
      * “Total Conversions”  
      * Checkpoint Table:  
        * Number of collections  
        * Number of conversions  
        * Last collection timestamp (diagnostic)  
        * Last conversion timestamp (diagnostic)  
        * Link to checkpoint landing page  
        * Enable toggle (default on)  
    * Hunter Dashboard:  
      * Number of active hunters  
      * Hunter details:  
        * Search/filter fields  
        * Hunter Nickname: (set/auto)  
        * Hunter private code  
        * Hunter recovery code  
        * Hunter active / complete status  
        * Number of collections  
        * Current score  
        * Last scan  
        * Last conversion  
        * Enable toggle (default on)  
  * Tools:  
    * Manual Hunter Recovery Tool  
    * Checkpoint bulk upload UI \- allows loading checkpoints from JSON  
    * Checkpoint manual creation tool  
    * Manual score override


*Updates*

- Developing on local environment, DB held in docker, prism DB manager  
- Routing backbone (local) built  
- Prototype UX working on test case  
- Initial Admin UX working \- Checkpoint Management tools  
- Test cookie proven for session persistence  
- Template for Admin verification via ZOD, not implemented

\*WIP items\*

- Player onboarding  
- Conversion analytics  
- Admin live dashboards  
- Prize redemption reporting  
- UI improvements  
- Automatic checkpoint slug creation  
- Automatic QR creation 


