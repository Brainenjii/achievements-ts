import isEmpty from "lodash/isEmpty";
import { distanceInWords } from "date-fns";

import {
  assignmentSolutionRequest,
  assignmentSubmitRequest,
  assignmentsSortChange,
  courseRemoveStudentDialogShow,
  assignmentPathProblemSolutionRequest,
  courseMoveStudentDialogShow,
  assignmentPathProgressSolutionRequest
} from "../../containers/Assignments/actions";

import PropTypes from "prop-types";
import React, { Fragment } from "react";

import withStyles from "@material-ui/core/styles/withStyles";

import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import Popper from "@material-ui/core/Popper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Tooltip from "@material-ui/core/Tooltip";

import DeleteIcon from "@material-ui/icons/Delete";
import DoneIcon from "@material-ui/icons/Done";
import SendIcon from "@material-ui/icons/Send";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import UserSwitch from "mdi-react/AccountSwitchIcon";

import { AccountService } from "../../services/account";
import { YOUTUBE_QUESTIONS } from "../../services/paths";
import { ASSIGNMENTS_TYPES } from "../../services/courses";
import { APP_SETTING } from "../../achievementsApp/config";

const MAX_TEXT_LENGTH = 40;
const MAX_NAME_LENGTH = 15;

const styles = theme => ({
  narrowCell: {
    padding: theme.spacing.unit
  },
  noWrapTooltip: {
    maxWidth: "none",
    minWidth: "none"
  }
});

class AssignmentsTable extends React.PureComponent {
  static propTypes = {
    classes: PropTypes.object,
    course: PropTypes.object,

    isInstructor: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
    sortState: PropTypes.object,
    currentUser: PropTypes.object,
    ui: PropTypes.object
  };

  state = {
    menuAnchor: null,
    currentStudent: null
  };

  getTooltip(assignment, solution) {
    if (
      !(
        solution.originalSolution &&
        solution.originalSolution.value &&
        solution.originalSolution.value
      )
    ) {
      return "";
    }
    let result = `Created: ${new Date(
      solution.originalSolution.createdAt
    ).toLocaleString()}`;
    switch (assignment.questionType) {
      // Backward compatibility
      case "PathProblem":
      case "PathActivity":
        if (
          solution.originalSolution.value.answers &&
          !isEmpty(solution.originalSolution.value.answers)
        ) {
          result +=
            "\nAnswers:\n" +
            Object.keys(solution.originalSolution.value.answers)
              .map(id => ({
                value: solution.originalSolution.value.answers[id],
                id
              }))
              .map(
                answer =>
                  `- ${YOUTUBE_QUESTIONS[answer.id] ||
                    assignment.customText}:\n   * ${answer.value
                    .split("\n")
                    .join("\n   * ")}`
              )
              .join("\n");
        }
        if (solution.originalSolution.value.cells) {
          result +=
            "\nSolution:\n" +
            solution.originalSolution.value.cells
              .map(cell => cell.source.join(""))
              .join("\n");
        }
        return result;
      default:
        return result;
    }
  }

  /**
   *
   * @param {String} result
   */
  getReducedLength(result) {
    const { classes } = this.props;

    result = result || "";

    if (result.length > MAX_TEXT_LENGTH) {
      return (
        <Tooltip classes={{ tooltip: classes.noWrapTooltip }} title={result}>
          <span>{result.slice(1, MAX_TEXT_LENGTH)}</span>
        </Tooltip>
      );
    }
    return result;
  }

  getSolution(assignment, solutions, owner) {
    const { classes } = this.props;
    let solution = solutions[assignment.id];
    const result = (solution && solution.value) || "";

    if (!solution) {
      return owner && APP_SETTING.isSuggesting ? (
        <IconButton onClick={() => this.onSubmitClick(assignment)}>
          <SendIcon />
        </IconButton>
      ) : (
        ""
      );
    }

    switch (assignment.questionType) {
      case ASSIGNMENTS_TYPES.Profile.id:
        return solution ? (
          <a
            href={`https://codecombat.com/user/${AccountService.processProfile(
              "CodeCombat",
              result.replace(/ \(\d+\)$/, "")
            )}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {APP_SETTING.isSuggesting ? (
              <IconButton
                onClick={() =>
                  owner &&
                  this.onSubmitClick(assignment, solutions[assignment.id])
                }
              >
                <DoneIcon />
              </IconButton>
            ) : (
              result
            )}
          </a>
        ) : (
          undefined
        );
      // Backward compatibility
      case "PathProblem":
      case ASSIGNMENTS_TYPES.PathActivity.id:
        return solution ? (
          <Tooltip
            classes={{ tooltip: classes.noWrapTooltip }}
            title={<pre>{this.getTooltip(assignment, solution)}</pre>}
          >
            <span>
              {/http[s]?:\/\//.test(
                solution.originalSolution && solution.originalSolution.value
              ) ? (
                <a
                  href={solution.originalSolution.value}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {APP_SETTING.isSuggesting ? (
                    <IconButton
                      onClick={() =>
                        owner &&
                        this.onSubmitClick(assignment, solutions[assignment.id])
                      }
                    >
                      <DoneIcon />
                    </IconButton>
                  ) : (
                    "Completed"
                  )}
                </a>
              ) : APP_SETTING.isSuggesting ? (
                <IconButton
                  onClick={() =>
                    owner &&
                    this.onSubmitClick(assignment, solutions[assignment.id])
                  }
                >
                  <DoneIcon />
                </IconButton>
              ) : (
                result
              )}
            </span>
          </Tooltip>
        ) : (
          result
        );

      case ASSIGNMENTS_TYPES.Text.id:
      case ASSIGNMENTS_TYPES.TeamText.id:
        return /http[s]?:\/\//.test(result) ? (
          <a href={result} rel="noopener noreferrer" target="_blank">
            {APP_SETTING.isSuggesting ? (
              <IconButton>
                <DoneIcon />
              </IconButton>
            ) : (
              "Completed"
            )}
          </a>
        ) : APP_SETTING.isSuggesting ? (
          <IconButton
            onClick={() =>
              this.onSubmitClick(assignment, solutions[assignment.id])
            }
          >
            <DoneIcon />
          </IconButton>
        ) : (
          this.getReducedLength(result)
        );
      default:
        return APP_SETTING.isSuggesting ? (
          <IconButton
            onClick={() =>
              owner && this.onSubmitClick(assignment, solutions[assignment.id])
            }
          >
            <DoneIcon />
          </IconButton>
        ) : (
          result
        );
    }
  }

  onStudentRemoveClick = studentInfo =>
    this.props.dispatch(
      courseRemoveStudentDialogShow(
        this.props.course.id,
        studentInfo.id,
        studentInfo.name
      )
    );

  onStudentMoveClick = studentInfo =>
    this.props.dispatch(
      courseMoveStudentDialogShow(
        this.props.course.id,
        studentInfo.id,
        studentInfo.name
      )
    );

  onCloseStudentMenu = () =>
    this.setState({ menuAnchor: false, currentStudent: false });
  onShowStudentMenu = (studentInfo, e) =>
    this.setState({ menuAnchor: e.target, currentStudent: studentInfo });

  onSortClick = assignment =>
    this.props.dispatch(
      assignmentsSortChange((assignment && assignment.id) || assignment)
    );

  onSubmitClick = (assignment, solution) => {
    const { course, dispatch } = this.props;

    switch (assignment.questionType) {
      case "CodeCombat":
      case "CodeCombat_Number":
        dispatch(
          assignmentSolutionRequest(course.id, assignment.id, "Complete")
        );
        break;
      // Backward compatibility
      case "PathProblem":
      case "PathActivity":
        dispatch(
          assignmentPathProblemSolutionRequest(
            assignment,
            course.owner,
            assignment.problem,
            solution
          )
        );
        break;
      case ASSIGNMENTS_TYPES.PathProgress.id:
        dispatch(
          assignmentPathProgressSolutionRequest(
            assignment,
            course.owner,
            assignment.path
          )
        );
        break;
      case ASSIGNMENTS_TYPES.TeamFormation.id:
        dispatch(
          assignmentSubmitRequest(
            assignment,
            solution &&
              solution.value && {
                ...solution,
                value: solution.value.replace(/ \(\d+\)$/, "")
              }
          )
        );
        break;
      default:
        dispatch(assignmentSubmitRequest(assignment, solution));
    }
  };

  render() {
    const {
      classes,
      /** @type AssignmentCourse */
      course,
      isInstructor,
      currentUser,
      sortState
    } = this.props;
    const { currentStudent } = this.state;

    return (
      <Fragment>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortState.field === "studentName"}
                  direction={sortState.direction}
                  onClick={() => this.onSortClick("studentName")}
                >
                  Student name
                </TableSortLabel>
              </TableCell>
              {course.assignments.map(assignment => (
                <TableCell
                  classes={{
                    root: classes.narrowCell
                  }}
                  key={assignment.id}
                  style={{
                    whiteSpace: "normal",
                    wordWrap: "break-word"
                  }}
                >
                  <TableSortLabel
                    active={sortState.field === assignment.id}
                    direction={sortState.direction}
                    onClick={() => this.onSortClick(assignment)}
                  >
                    {assignment.name}
                  </TableSortLabel>
                  <div>
                    {assignment.details && (
                      <a
                        href={assignment.details}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        details
                      </a>
                    )}
                    {(assignment.details ? " " : "") + assignment.progress ||
                      ""}
                  </div>
                  {!APP_SETTING.isSuggesting && (
                    <div>
                      {assignment.deadline &&
                        `Deadline in ${distanceInWords(
                          assignment.deadline,
                          new Date()
                        )}`}
                    </div>
                  )}
                </TableCell>
              ))}
              {isInstructor && (
                <TableCell>
                  <TableSortLabel
                    active={sortState.field === "progress"}
                    direction={sortState.direction}
                    onClick={() => this.onSortClick("progress")}
                  >
                    Progress
                  </TableSortLabel>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(course.members).map(id => {
              const studentInfo = course.members[id];
              return (
                <TableRow key={studentInfo.id}>
                  <TableCell>
                    {isInstructor &&
                      course.owner === currentUser.id && (
                        <IconButton
                          onClick={e => this.onShowStudentMenu(studentInfo, e)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    {studentInfo.name.slice(0, MAX_NAME_LENGTH) +
                      (studentInfo.length > MAX_NAME_LENGTH ? "..." : "")}
                  </TableCell>
                  {course.assignments.map(assignment => (
                    <TableCell key={assignment.id}>
                      <Fragment>
                        {this.getSolution(
                          assignment,
                          studentInfo.solutions,
                          studentInfo.id === currentUser.id
                        )}

                        {studentInfo.id === currentUser.id &&
                          (!APP_SETTING.isSuggesting && (
                            <Button
                              onClick={() =>
                                this.onSubmitClick(
                                  assignment,
                                  studentInfo.solutions[assignment.id]
                                )
                              }
                              style={{
                                marginLeft: 4
                              }}
                              variant="raised"
                            >
                              {studentInfo.solutions[assignment.id]
                                ? "Update"
                                : "Submit"}
                            </Button>
                          ))}
                      </Fragment>
                    </TableCell>
                  ))}
                  {isInstructor && (
                    <TableCell>
                      {`${studentInfo.progress.totalSolutions} / ${
                        course.totalAssignments
                      } ${
                        studentInfo.progress.lastSolutionTime
                          ? new Date(
                              studentInfo.progress.lastSolutionTime
                            ).toLocaleTimeString()
                          : ""
                      }`}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {currentStudent && (
          <Popper
            anchorEl={this.state.menuAnchor}
            open={true}
            placement="left-start"
          >
            <Paper>
              <ClickAwayListener onClickAway={this.onCloseStudentMenu}>
                <MenuList>
                  <MenuItem
                    onClick={() => this.onStudentMoveClick(currentStudent)}
                  >
                    <ListItemIcon>
                      <UserSwitch style={{ fill: "rgba(0, 0, 0, 0.54)" }} />
                    </ListItemIcon>
                    <ListItemText>Move student to another course</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => this.onStudentRemoveClick(currentStudent)}
                  >
                    <ListItemIcon>
                      <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText>Remove student from course</ListItemText>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Popper>
        )}
      </Fragment>
    );
  }
}

export default withStyles(styles)(AssignmentsTable);
