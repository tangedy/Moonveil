import type { DialogueChoice, DialoguePage } from '../ui/DialogueOverlay';
import type {
  BreadInterpretation,
  HouseStarOutcome,
  PhotographBelief,
  PortraitSubject,
  StarStatement,
  ToyInterpretation,
} from '../state/GameState';

const pages = (value: DialoguePage[]): DialoguePage[] => value;

export const houseChoices = {
  bread: [
    { id: 'difficult-mornings', label: 'Someone wanted waking up to feel worthwhile.' },
    { id: 'welcome', label: 'Someone wanted breakfast to feel like being welcomed.' },
    { id: 'habit', label: 'The smell knew the way, even when the rooms did not.' },
  ] satisfies DialogueChoice[],
  toy: [
    { id: 'company', label: 'The child wanted to be where everyone else was.' },
    { id: 'forgotten', label: 'Someone carried it out and forgot to return it.' },
    { id: 'waiting', label: 'It was waiting where the child could find it.' },
  ] satisfies DialogueChoice[],
  belief: [
    { id: 'dreamer', label: 'The photograph would erase me.' },
    { id: 'keeper', label: 'The photograph would erase Keeper.' },
    { id: 'neither', label: 'It would erase someone neither of us remembers.' },
  ] satisfies DialogueChoice[],
  star: [
    { id: 'outside-unknown', label: 'I don’t know what will happen outside.' },
    { id: 'house-changing', label: 'The House is changing.' },
    { id: 'safe-here', label: 'You’re safe here.' },
    { id: 'choose', label: 'You can choose.' },
  ] satisfies DialogueChoice[],
} as const;

export const houseDialogue = {
  thresholdMoth: pages([
    { speaker: 'Moth', text: 'The House remembers me incorrectly.' },
    { speaker: 'DREAMER', text: 'Are you coming in?' },
    { speaker: 'Moth', text: 'I am accompanying you from a very responsible distance.' },
  ]),
  thresholdMothRepeat: pages([
    { speaker: 'Moth', text: 'I am still accompanying you.' },
    { speaker: 'DREAMER', text: 'You are outside.' },
    { speaker: 'Moth', text: 'That is where the responsible distance is.' },
  ]),
  keeperIntroduction: [
    pages([
      { speaker: 'KEEPER', text: 'You’re late.' },
      { speaker: 'DREAMER', text: 'For what?' },
      { speaker: 'KEEPER', text: 'I had hoped you would know.' },
      { speaker: 'KEEPER', text: 'It would make the waiting seem much better organized.' },
    ]),
    pages([
      { speaker: 'KEEPER', text: 'Please wipe your feet.' },
      { speaker: 'DREAMER', text: 'On what?' },
      { speaker: 'KEEPER', text: 'The mat.' },
      { speaker: 'DREAMER', text: 'There isn’t one.' },
      { speaker: 'KEEPER', text: 'No.' },
      { speaker: 'KEEPER', text: 'It was always getting underfoot.' },
    ]),
    pages([
      { speaker: 'KEEPER', text: 'Welcome home.' },
      { speaker: 'DREAMER', text: 'This isn’t my home.' },
      { speaker: 'KEEPER', text: 'Then please forgive the House.' },
      { speaker: 'KEEPER', text: 'It has mistaken you very thoroughly.' },
    ]),
    pages([
      { speaker: 'DREAMER', text: 'Who are you?' },
      { speaker: 'KEEPER', text: 'I keep the House.' },
      { speaker: 'DREAMER', text: 'Is Keeper your name?' },
      { speaker: 'KEEPER', text: 'It has answered adequately for a long time.' },
      { speaker: 'DREAMER', text: 'That isn’t the same as yes.' },
      { speaker: 'KEEPER', text: 'No answer remains the same as yes for very long.' },
    ]),
    pages([
      { speaker: 'DREAMER', text: 'Where are the doors?' },
      { speaker: 'KEEPER', text: 'Between the rooms.' },
      { speaker: 'DREAMER', text: 'I don’t see them.' },
      { speaker: 'KEEPER', text: 'Yes. That is the difficulty.' },
      { speaker: 'DREAMER', text: 'A house needs doors.' },
      { speaker: 'KEEPER', text: 'A house needs rooms.' },
      { speaker: 'KEEPER', text: 'Doors are merely agreements about the order.' },
    ]),
  ],
  keeperThresholdRepeat: pages([
    { speaker: 'KEEPER', text: 'The sitting room is expecting you.' },
    { speaker: 'DREAMER', text: 'How can it expect me?' },
    { speaker: 'KEEPER', text: 'It becomes nervous when you approach.' },
  ]),
  keeperMemory: pages([
    { speaker: 'DREAMER', text: 'Do you remember everything about this House?' },
    { speaker: 'KEEPER', text: 'Everything important.' },
    { speaker: 'DREAMER', text: 'Who decided what was important?' },
    { speaker: 'KEEPER', text: 'That question was not retained.' },
    { speaker: 'KEEPER', text: 'Memory is not merely keeping what happened. It is keeping it where it happened.' },
  ]),
  keeperPreservation: pages([
    { speaker: 'DREAMER', text: 'Why preserve all this?' },
    { speaker: 'KEEPER', text: 'Because it was loved.' },
    { speaker: 'DREAMER', text: 'Is it still loved?' },
    { speaker: 'KEEPER', text: 'I have preserved that too.' },
    { speaker: 'DREAMER', text: 'Keeping something isn’t the same as loving it.' },
    { speaker: 'KEEPER', text: 'No. Keeping is what remains when loving can no longer reach it.' },
  ]),
  historyContradiction: pages([
    { speaker: 'DREAMER', text: 'Tell me who I was.' },
    { speaker: 'KEEPER', text: 'You belonged here.' },
    { speaker: 'Moth', text: 'You visited.' },
    { speaker: 'KEEPER', text: 'Frequently.' },
    { speaker: 'Moth', text: 'Desperately.' },
    { speaker: 'KEEPER', text: 'Happily.' },
    { speaker: 'Moth', text: 'Sometimes.' },
    { speaker: 'DREAMER', text: 'Which of you is telling the truth?' },
    { speaker: 'Moth', text: 'We both are.' },
    { speaker: 'KEEPER', text: 'That is the problem.' },
  ]),
  mothKeeperTension: pages([
    { speaker: 'KEEPER', text: 'You brought them back.' },
    { speaker: 'Moth', text: 'They brought themself. I merely worried nearby.' },
    { speaker: 'KEEPER', text: 'You have always mistaken worry for accompaniment.' },
    { speaker: 'Moth', text: 'And you have always mistaken furniture for forgiveness.' },
  ]),

  sittingArrival: pages([
    { text: 'Rain falls across the sitting room.' },
    { text: 'The carpet remains dry. The furniture is less fortunate.' },
    { speaker: 'KEEPER', text: 'Please sit wherever you were happiest.' },
    { speaker: 'DREAMER', text: 'I don’t remember being here.' },
    { speaker: 'KEEPER', text: 'Then any chair will be equally disappointing.' },
  ]),
  rainFurniture: pages([
    { text: 'Rain taps on the armchair and nowhere else.' },
    { text: 'The chair appears accustomed to being singled out.' },
  ]),
  chairs: pages([
    { text: 'Six chairs face one empty place at the table.' },
    { speaker: 'DREAMER', text: 'Who used to sit here?' },
    { speaker: 'KEEPER', text: 'The family.' },
    { speaker: 'DREAMER', text: 'Which family?' },
    { speaker: 'KEEPER', text: 'The one the furniture remembers.' },
  ]),
  windowFirst: pages([
    { text: 'The window looks into a room containing an empty chair.' },
    { text: 'Someone is absent very loudly.' },
  ]),
  windowRepeat: pages([
    { text: 'The same empty chair waits beyond the window.' },
    { text: 'There is no outside behind it.' },
  ]),
  toyBefore: pages([
    { text: 'A wooden toy rests beneath the longest chair.' },
    { text: 'One wheel is polished by a hand that is not here.' },
  ]),
  toyPrompt: pages([
    { speaker: 'DREAMER', text: 'This toy belongs with the cradle.' },
    { speaker: 'KEEPER', text: 'It was kept in the sitting room.' },
    { speaker: 'KEEPER', text: 'If you insist they belong together, you should say why.' },
  ]),
  toyResolved: {
    company: pages([
      { speaker: 'DREAMER', text: 'The child wanted to be where everyone else was.' },
      { speaker: 'KEEPER', text: 'Then the nursery was wherever the family gathered.' },
    ]),
    forgotten: pages([
      { speaker: 'DREAMER', text: 'Someone carried it out and forgot to return it.' },
      { speaker: 'KEEPER', text: 'You have made carelessness into architecture.' },
      { speaker: 'DREAMER', text: 'It still made a way back.' },
    ]),
    waiting: pages([
      { speaker: 'DREAMER', text: 'It was waiting where the child could find it.' },
      { speaker: 'KEEPER', text: 'The House has considerable practice at waiting.' },
    ]),
  } satisfies Record<ToyInterpretation, DialoguePage[]>,
  toyAfter: pages([
    { text: 'The toy points toward the nursery now.' },
    { text: 'It does not appear to remember turning.' },
  ]),

  bedroomArrival: pages([
    { text: 'The bed is unmade with great precision.' },
    { speaker: 'KEEPER', text: 'This bed has never been slept in.' },
    { speaker: 'DREAMER', text: 'Why is it unmade?' },
    { speaker: 'KEEPER', text: 'It has had nightmares.' },
  ]),
  bed: pages([
    { text: 'The sheets remember the shape of someone who never arrived.' },
    { speaker: 'DREAMER', text: 'Whose room was this?' },
    { speaker: 'KEEPER', text: 'Someone who needed it.' },
    { speaker: 'DREAMER', text: 'Did they live here?' },
    { speaker: 'KEEPER', text: 'Not successfully.' },
  ]),
  drawerFirst: pages([
    { text: 'The drawer opens before you touch it.' },
    { text: 'Inside is a white sleeve folded to your size.' },
    { speaker: 'KEEPER', text: 'Do not open any drawers that recognize you.' },
    { speaker: 'DREAMER', text: 'That advice arrived late.' },
  ]),
  drawerRepeat: pages([
    { text: 'The drawer remains politely open.' },
    { text: 'The sleeve has not stopped fitting you.' },
  ]),
  breadBefore: pages([
    { text: 'The bedroom smells like bread.' },
    { speaker: 'KEEPER', text: 'It did on difficult mornings.' },
    { speaker: 'DREAMER', text: 'Why?' },
    { speaker: 'KEEPER', text: 'Someone wanted waking up to feel worthwhile.' },
  ]),
  breadPrompt: pages([
    { text: 'The warm smell gathers at a blank wall.' },
    { speaker: 'KEEPER', text: 'If that wall is a way to the kitchen, tell it why.' },
  ]),
  breadResolved: {
    'difficult-mornings': pages([
      { speaker: 'DREAMER', text: 'Someone wanted waking up to feel worthwhile.' },
      { speaker: 'KEEPER', text: 'The House remembers kindness more readily than the person who needed it.' },
    ]),
    welcome: pages([
      { speaker: 'DREAMER', text: 'Someone wanted breakfast to feel like being welcomed.' },
      { speaker: 'KEEPER', text: 'Then perhaps the kitchen has been welcoming an empty room.' },
    ]),
    habit: pages([
      { speaker: 'DREAMER', text: 'The smell knew the way, even when the rooms did not.' },
      { speaker: 'KEEPER', text: 'A habit is a door too small to notice.' },
    ]),
  } satisfies Record<BreadInterpretation, DialoguePage[]>,
  breadAfter: pages([
    { text: 'Warm air passes through the remembered kitchen doorway.' },
    { speaker: 'KEEPER', text: 'Forgotten is not the same as invited back incorrectly.' },
  ]),

  kitchenArrival: pages([
    { text: 'The meal is still warm.' },
    { speaker: 'KEEPER', text: 'Please don’t comment on it.' },
    { speaker: 'DREAMER', text: 'Why?' },
    { speaker: 'KEEPER', text: 'It will think we have expectations.' },
  ]),
  kitchenTable: pages([
    { speaker: 'KEEPER', text: 'The kitchen is set for six.' },
    { speaker: 'DREAMER', text: 'There are seven plates.' },
    { speaker: 'KEEPER', text: 'One of them is an apology.' },
  ]),
  warmMeal: pages([
    { text: 'Steam rises, reaches the ceiling, and returns to the bowls.' },
    { text: 'Nothing has been served. Nothing has grown cold.' },
  ]),
  brokenCup: pages([
    { text: 'A cup has been repaired around the crack.' },
    { speaker: 'DREAMER', text: 'You could repair it properly.' },
    { speaker: 'KEEPER', text: 'Then it would be broken incorrectly.' },
  ]),

  nurseryArrival: pages([
    { text: 'A cradle occupies most of the nursery.' },
    { speaker: 'DREAMER', text: 'The cradle is enormous.' },
    { speaker: 'KEEPER', text: 'The child grew.' },
    { speaker: 'DREAMER', text: 'Why didn’t you replace it with a bed?' },
    { speaker: 'KEEPER', text: 'They might have come back smaller.' },
  ]),
  cradle: pages([
    { text: 'The cradle could hold an adult comfortably.' },
    { text: 'Comfortably is not the same as kindly.' },
  ]),
  nurseryWall: pages([
    { text: 'Height marks descend as they get older.' },
    { text: 'The final mark is nearest the floor.' },
  ]),

  sproutArrival: pages([
    { speaker: 'Sprout', text: 'I have entered the House Without Doors.' },
    { speaker: 'KEEPER', text: 'Through a window.' },
    { speaker: 'Sprout', text: 'The House should be more specific.' },
    { speaker: 'KEEPER', text: 'You are dropping leaves.' },
    { speaker: 'Sprout', text: 'I do that when I grow.' },
    { speaker: 'KEEPER', text: 'Kindly stop.' },
    { speaker: 'Sprout', text: 'I do not think I should.' },
  ]),
  sproutRepeat: pages([
    { speaker: 'Sprout', text: 'This room is frightening.' },
    { speaker: 'KEEPER', text: 'Nothing here will harm you.' },
    { speaker: 'Sprout', text: 'That is not the only kind of frightening.' },
  ]),
  sproutAfterPhoto: pages([
    { speaker: 'Sprout', text: 'There is a room the House has not decided how to remember.' },
    { speaker: 'DREAMER', text: 'How do you know?' },
    { speaker: 'Sprout', text: 'Something is growing toward it.' },
  ]),

  hallwayArrival: pages([
    { text: 'Every portrait faces the wall.' },
    { speaker: 'DREAMER', text: 'The portraits asked for privacy?' },
    { speaker: 'KEEPER', text: 'The walls did.' },
  ]),
  hallwayLength: pages([
    { speaker: 'DREAMER', text: 'Why is this hallway so long?' },
    { speaker: 'KEEPER', text: 'You are remembering it slowly.' },
  ]),
  portraitFirst: pages([
    { speaker: 'KEEPER', text: 'Leave it.' },
    { speaker: 'DREAMER', text: 'I want to see.' },
    { speaker: 'KEEPER', text: 'Wanting to see is not always different from wanting to decide.' },
    { text: 'You turn the portrait around.' },
  ]),
  portraitSubject: {
    woman: pages([
      { text: 'A woman sits inside the portrait.' },
      { speaker: 'DREAMER', text: 'Who is she?' },
      { speaker: 'KEEPER', text: 'She was here.' },
      { speaker: 'DREAMER', text: 'What was her name?' },
      { speaker: 'KEEPER', text: 'She had several. I used the one that brought her downstairs.' },
    ]),
    'empty-chair': pages([
      { text: 'The portrait contains an empty chair.' },
      { speaker: 'DREAMER', text: 'There’s no one in it.' },
      { speaker: 'KEEPER', text: 'That does not mean it is empty.' },
      { speaker: 'DREAMER', text: 'What’s the difference?' },
      { speaker: 'KEEPER', text: 'Someone can be absent very loudly.' },
    ]),
    dreamer: pages([
      { text: 'DREAMER looks back from inside the portrait.' },
      { speaker: 'DREAMER', text: 'That’s me.' },
      { speaker: 'KEEPER', text: 'Is it?' },
      { speaker: 'DREAMER', text: 'It has my shape.' },
      { speaker: 'KEEPER', text: 'Then resemblance has become very ambitious.' },
    ]),
  } satisfies Record<PortraitSubject, DialoguePage[]>,
  portraitSettles: pages([
    { speaker: 'KEEPER', text: 'There. It has chosen what you saw.' },
    { speaker: 'DREAMER', text: 'I didn’t choose.' },
    { speaker: 'KEEPER', text: 'Attention is often choice without the courtesy of announcing itself.' },
  ]),
  portraitRepeat: pages([
    { text: 'The portrait has become certain.' },
    { text: 'Certainty has not made it friendlier.' },
  ]),

  photographDiscover: pages([
    { text: 'A smaller photograph hangs beneath the portrait.' },
    { speaker: 'DREAMER', text: 'There’s something moving in the picture.' },
    { speaker: 'KEEPER', text: 'Do not alarm it.' },
    { speaker: 'DREAMER', text: 'You knew it was alive?' },
    { speaker: 'KEEPER', text: 'I knew it had not accepted being still.' },
    { speaker: 'DREAMER', text: 'Is that the star?' },
    { speaker: 'KEEPER', text: 'It is part of the photograph.' },
    { speaker: 'DREAMER', text: 'It’s trying to get out.' },
    { speaker: 'KEEPER', text: 'Many things appear to struggle when properly preserved.' },
  ]),
  photographNeedsMoth: pages([
    { text: 'The photograph turns itself toward the threshold.' },
    { speaker: 'KEEPER', text: 'It appears to want a second unreliable witness.' },
    { speaker: 'DREAMER', text: 'Moth?' },
    { speaker: 'KEEPER', text: 'Very gently.' },
  ]),
  beliefPrompt: pages([
    { text: 'One figure in the photograph blurs whenever the star touches the glass.' },
    { text: 'If the star leaves, you think the photograph will forget someone.' },
  ]),
  beliefResponse: {
    dreamer: pages([
      { speaker: 'DREAMER', text: 'I think it would erase me.' },
      { speaker: 'KEEPER', text: 'The House has mistaken you before. That does not mean it can bear correcting itself.' },
    ]),
    keeper: pages([
      { speaker: 'DREAMER', text: 'I think it would erase you.' },
      { speaker: 'KEEPER', text: 'Then I have been preserved in a very inefficient location.' },
    ]),
    neither: pages([
      { speaker: 'DREAMER', text: 'It might erase someone neither of us remembers.' },
      { speaker: 'KEEPER', text: 'Being forgotten does not make a person available for further forgetting.' },
    ]),
  } satisfies Record<PhotographBelief, DialoguePage[]>,
  starResistance: pages([
    { speaker: 'KEEPER', text: 'It belongs in the photograph.' },
    { speaker: 'DREAMER', text: 'It’s alive.' },
    { speaker: 'KEEPER', text: 'That is why it must be protected.' },
    { speaker: 'DREAMER', text: 'It wants to leave.' },
    { speaker: 'KEEPER', text: 'Wanting is frequently how loss introduces itself.' },
    { text: 'The star waits against the glass.' },
  ]),
  starResponse: {
    'outside-unknown': pages([
      { speaker: 'DREAMER', text: 'I don’t know what will happen outside.' },
      { text: 'The star becomes very still.' },
      { text: 'For the first time, it seems to believe you.' },
    ]),
    'house-changing': pages([
      { speaker: 'DREAMER', text: 'The House is changing.' },
      { text: 'The star presses close to the glass.' },
      { text: 'It is frightened. It is also listening.' },
    ]),
    'safe-here': pages([
      { speaker: 'DREAMER', text: 'You’re safe here.' },
      { text: 'The star moves farther from the glass.' },
      { text: 'It has heard that sentence before.' },
    ]),
    choose: pages([
      { speaker: 'DREAMER', text: 'You can choose.' },
      { text: 'Nothing happens.' },
      { text: 'Then the star turns away from you.' },
      { text: 'It appears to be thinking.' },
    ]),
  } satisfies Record<StarStatement, DialoguePage[]>,
  starOutcome: {
    left: pages([
      { text: 'The star passes through the glass.' },
      { text: 'The believed figure fades from the photograph. You cannot tell if you were right.' },
      { speaker: 'KEEPER', text: 'Put it back.' },
      { speaker: 'DREAMER', text: 'I can’t. It chose to leave.' },
      { speaker: 'KEEPER', text: 'Choices are not immune to correction.' },
      { speaker: 'KEEPER', text: 'I’m sorry.' },
      { speaker: 'DREAMER', text: 'To the star?' },
      { speaker: 'KEEPER', text: 'To the room it left behind.' },
    ]),
    shared: pages([
      { text: 'The star divides its light without dividing itself.' },
      { text: 'A reflected point settles into your palm.' },
      { speaker: 'KEEPER', text: 'The photograph is dimmer.' },
      { speaker: 'DREAMER', text: 'It is still here.' },
      { speaker: 'KEEPER', text: 'Those facts are refusing to comfort each other.' },
    ]),
    remained: pages([
      { text: 'The star settles in the photograph’s window.' },
      { text: 'Its light no longer strikes the glass like a fist.' },
      { speaker: 'DREAMER', text: 'It’s staying.' },
      { speaker: 'KEEPER', text: 'Yes.' },
      { speaker: 'DREAMER', text: 'You sound disappointed.' },
      { speaker: 'KEEPER', text: 'I had prepared to be right for different reasons.' },
    ]),
    delayed: pages([
      { text: 'The star remains turned away.' },
      { text: 'The photograph has made room for its uncertainty.' },
      { speaker: 'KEEPER', text: 'How long will it take?' },
      { speaker: 'DREAMER', text: 'As long as it needs.' },
      { speaker: 'KEEPER', text: 'That is a very disorderly measurement.' },
    ]),
  } satisfies Record<HouseStarOutcome, DialoguePage[]>,
  photographAfter: pages([
    { text: 'The photograph has finished changing for now.' },
    { text: 'For now appears to be doing important work.' },
  ]),

  unkeptArrival: pages([
    { text: 'This room contains no preserved arrangement.' },
    { text: 'Dust waits in several incompatible corners.' },
    { speaker: 'KEEPER', text: 'This room was never assigned a proper purpose.' },
    { speaker: 'Sprout', text: 'It looks relieved.' },
  ]),
  unkeptObjects: pages([
    { text: 'A table begins at one end of the room and becomes a shelf halfway through.' },
    { text: 'Nothing here has been told what it must remain.' },
  ]),
  leafPrompt: pages([
    { text: 'Sprout places a living green leaf in your hand.' },
    { speaker: 'KEEPER', text: 'That does not belong here.' },
    { speaker: 'DREAMER', text: 'Not yet.' },
    { speaker: 'KEEPER', text: '“Yet” is not a location.' },
    { speaker: 'Sprout', text: 'It is where I live.' },
  ]),
  leafGrowth: pages([
    { text: 'The leaf takes root in a crack that was not there before.' },
    { text: 'A small white flower pushes the floor apart.' },
    { speaker: 'KEEPER', text: 'Remove it.' },
    { speaker: 'DREAMER', text: 'It’s alive.' },
    { speaker: 'KEEPER', text: 'As was everything here, once.' },
    { speaker: 'Sprout', text: 'You could let it become here now.' },
    { speaker: 'KEEPER', text: '...' },
    { speaker: 'KEEPER', text: '..It may stay.' },
    { speaker: 'Sprout', text: 'Thank you.' },
    { speaker: 'KEEPER', text: 'I was speaking to the plant.' },
    { speaker: 'Sprout', text: 'So was I.' },
  ]),
  plantRepeat: pages([
    { speaker: 'KEEPER', text: 'I had forgotten how untidy growing is.' },
    { text: 'Roots outline a passage where no door used to be.' },
  ]),
  farewell: pages([
    { speaker: 'KEEPER', text: 'You should go.' },
    { speaker: 'DREAMER', text: 'Do you want me to?' },
    { speaker: 'KEEPER', text: '...' },

    { speaker: 'KEEPER', text: '..No.' },
    { speaker: 'KEEPER', text: 'But I am attempting not to confuse that with a reason you must stay.' },
    { speaker: 'DREAMER', text: 'Will the House be all right?' },
    { speaker: 'KEEPER', text: 'It has survived being remembered.' },
    { speaker: 'KEEPER', text: 'Perhaps it can survive becoming something else.' },
    { speaker: 'DREAMER', text: 'If I come back different, will you recognize me?' },
    { speaker: 'KEEPER', text: 'I will practice.' },
  ]),
  exitRepeat: pages([
    { text: 'The new passage waits without pretending it was always here.' },
  ]),
} as const;
