// Komponen editor per jenis soal (bagian registri yang bergantung pada Vue).
import CategorizeEditor from '../components/editors/CategorizeEditor.vue'
import EssayEditor from '../components/editors/EssayEditor.vue'
import FillBlankEditor from '../components/editors/FillBlankEditor.vue'
import MatchingEditor from '../components/editors/MatchingEditor.vue'
import MultipleChoiceEditor from '../components/editors/MultipleChoiceEditor.vue'
import NumericEditor from '../components/editors/NumericEditor.vue'
import OrderingEditor from '../components/editors/OrderingEditor.vue'
import ShortAnswerEditor from '../components/editors/ShortAnswerEditor.vue'
import SingleChoiceEditor from '../components/editors/SingleChoiceEditor.vue'
import TrueFalseEditor from '../components/editors/TrueFalseEditor.vue'
import TrueFalseGroupEditor from '../components/editors/TrueFalseGroupEditor.vue'

export const EDITORS = {
  single_choice: SingleChoiceEditor,
  multiple_choice: MultipleChoiceEditor,
  true_false: TrueFalseEditor,
  true_false_group: TrueFalseGroupEditor,
  matching: MatchingEditor,
  ordering: OrderingEditor,
  categorize: CategorizeEditor,
  short_answer: ShortAnswerEditor,
  numeric: NumericEditor,
  fill_blank: FillBlankEditor,
  essay: EssayEditor,
}
