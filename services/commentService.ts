import { Types } from "mongoose";
import Comment from "../models/schemas/comment";
import Question from "../models/schemas/question";

const CommentService = {
  // 커뮤니티 댓글 생성
  async createComment(
    postId: Types.ObjectId,
    id: string,
    name: string,
    profileImage: string,
    checkedBadge: string,
    comment: string,
  ) {
    try {
      const newComment = new Comment({
        postId,
        id,
        name,
        profileImage,
        checkedBadge,
        comment,
      });
      await newComment.save();

      // 게시글 commentIds 배열에 새로운 댓글 ID 추가.
      const post = await Question.findById(postId);
      if (!post) {
        throw new Error("게시글을 찾을 수 없습니다.");
      }
      post.commentIds.push(newComment._id);
      await post.save();

      return newComment; // 새로운 댓글의 ID를 반환
    } catch (error) {
      console.error(error);
      throw new Error("커뮤니티 댓글 생성에 실패하였습니다.");
    }
  },

  // 커뮤니티 댓글 수정
  async updateComment(id: Types.ObjectId, comment: string, userId: string) {
    try {
      const targetComment = await Comment.findById(id);
      if (!targetComment) {
        throw new Error("커뮤니티 댓글을 찾을 수 없습니다.");
      }
      if (targetComment.id !== userId) {
        throw new Error("작성자만 댓글을 수정할 수 있습니다.");
      }

      const updatedComment = await Comment.findByIdAndUpdate(
        id,
        { comment },
        { new: true, useFindAndModify: false },
      );

      return updatedComment;
    } catch (error) {
      console.error(error);
      throw new Error("커뮤니티 댓글 수정에 실패하였습니다.");
    }
  },

  // 커뮤니티 댓글 삭제
  async deleteComment(id: Types.ObjectId, userId: string) {
    try {
      const targetComment = await Comment.findById(id);
      if (!targetComment) {
        throw new Error("커뮤니티 댓글을 찾을 수 없습니다.");
      }
      if (targetComment.id !== userId) {
        throw new Error("작성자만 댓글을 삭제할 수 있습니다.");
      }

      const post = await Question.findById(targetComment.postId);
      if (!post) {
        throw new Error("게시글을 찾을 수 없습니다.");
      }

      post.commentIds = post.commentIds.filter(
        commentId => commentId.toString() !== id.toString(),
      );
      await post.save();

      await Comment.findByIdAndDelete(id);

      return "댓글이 정상적으로 삭제되었습니다.";
    } catch (error) {
      console.error(error);
      throw new Error("커뮤니티 댓글 삭제에 실패하였습니다.");
    }
  },

  // 댓글 좋아요 누르기 / 취소하기
  async toggleLike(
    postId: string,
    commentId: string,
    _id: string,
    name: string,
  ) {
    try {
      const post = await Question.findById(postId);
      if (!post) {
        throw new Error("게시글을 찾을 수 없습니다.");
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error("댓글을 찾을 수 없습니다.");
      }

      const likeIndex = comment.likeIds.findIndex(like => like._id == _id);
      if (likeIndex === -1) {
        comment.likeIds.push({ _id, name });
      } else {
        comment.likeIds.splice(likeIndex, 1);
      }
      await comment.save();
      return comment;
    } catch (error) {
      console.error(error);
      throw new Error("댓글 좋아요 기능 처리에 실패하였습니다.");
    }
  },

  // 게시글의 댓글 조회
  async readComment(id: Types.ObjectId) {
    try {
      const comment = await Comment.aggregate([
        { $match: { _id: new Types.ObjectId(id) } },
        {
          $addFields: {
            numLikes: { $size: "$likeIds" },
          },
        },
      ]);

      if (!comment || comment.length === 0) {
        throw new Error("커뮤니티 댓글을 찾을 수 없습니다.");
      }

      return comment[0];
    } catch (error) {
      console.error(error);
      throw new Error("커뮤니티 댓글 조회에 실패하였습니다.");
    }
  },

  // 게시글의 모든 댓글 조회
  async readAllCommentsOfPost(postId: Types.ObjectId) {
    try {
      const comments = await Comment.aggregate([
        { $match: { postId: new Types.ObjectId(postId) } },
        {
          $addFields: {
            numLikes: { $size: "$likeIds" },
          },
        },
      ]);

      return comments;
    } catch (error) {
      console.error(error);
      throw new Error("해당 게시글의 모든 댓글을 불러오는데 실패하였습니다.");
    }
  },
};

export default CommentService;
